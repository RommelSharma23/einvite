// File: src/app/api/photo-upload/download-zip/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import archiver from 'archiver'
import { Readable } from 'stream'

interface DownloadRequest {
  bucketId: string
  downloadType: 'all' | 'guest' | 'selected'
  sessionId?: string // For guest-specific downloads
  photoIds?: string[] // For selected photos downloads
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body: DownloadRequest = await request.json()
    const { bucketId, downloadType, sessionId, photoIds } = body

    if (!bucketId) {
      return NextResponse.json({ error: 'Bucket ID is required' }, { status: 400 })
    }

    // Get bucket info
    const { data: bucket, error: bucketError } = await supabaseAdmin
      .from('guest_upload_buckets')
      .select('bucket_name, storage_path')
      .eq('id', bucketId)
      .single()

    if (bucketError || !bucket) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    let whereClause = `bucket_id.eq.${bucketId}`
    let zipFileName = `${bucket.bucket_name.replace(/[^a-z0-9]/gi, '-')}-photos.zip`

    // Build query based on download type
    if (downloadType === 'guest' && sessionId) {
      whereClause = `session_id.eq.${sessionId}`
      // Get guest name for filename
      const { data: sessionData } = await supabaseAdmin
        .from('guest_upload_sessions')
        .select('guest_name')
        .eq('id', sessionId)
        .single()
      
      if (sessionData) {
        const sanitizedName = sessionData.guest_name.replace(/[^a-z0-9]/gi, '-')
        zipFileName = `${bucket.bucket_name}-${sanitizedName}-photos.zip`
      }
    } else if (downloadType === 'selected' && photoIds && photoIds.length > 0) {
      whereClause = `id.in.(${photoIds.join(',')})`
      zipFileName = `${bucket.bucket_name}-selected-photos.zip`
    }

    // Get photos to download
    const { data: photosData, error: photosError } = await supabaseAdmin
      .from('guest_uploads')
      .select(`
        id,
        original_filename,
        stored_filename,
        file_url,
        session_id,
        guest_upload_sessions!inner (
          guest_name,
          bucket_id
        )
      `)
      .or(whereClause)
      .order('uploaded_at', { ascending: true })

    if (photosError || !photosData || photosData.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 })
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    // Set up response headers for ZIP download
    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipFileName}"`,
      'Cache-Control': 'no-cache'
    })

    // Group photos by guest for organized folder structure
    const photosByGuest = new Map<string, typeof photosData>()
    
    for (const photo of photosData) {
      const guestKey = `${photo.guest_upload_sessions.guest_name} (${photo.session_id})`
      if (!photosByGuest.has(guestKey)) {
        photosByGuest.set(guestKey, [])
      }
      photosByGuest.get(guestKey)!.push(photo)
    }

    // Add photos to archive organized by guest folders
    for (const [guestName, guestPhotos] of photosByGuest.entries()) {
      const sanitizedGuestName = guestName.replace(/[^a-z0-9\s\(\)]/gi, '-')
      
      for (const photo of guestPhotos) {
        try {
          // Extract storage path from file_url
          // URL format: https://project.supabase.co/storage/v1/object/public/Guest_upload/path/to/file.jpg
          // We need: path/to/file.jpg
          const urlParts = photo.file_url.split('/public/Guest_upload/')
          const storagePath = urlParts.length > 1 ? urlParts[1] : null
          
          if (!storagePath) {
            console.error('Could not extract storage path from URL:', photo.file_url)
            continue
          }
          
          // Download photo from Supabase Storage
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('Guest_upload')
            .download(storagePath)

          if (downloadError || !fileData) {
            console.error('Error downloading photo:', downloadError, 'Path:', storagePath)
            continue
          }

          // Convert Blob to Buffer
          const arrayBuffer = await fileData.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          // Add to archive with organized path
          const archivePath = downloadType === 'guest' 
            ? photo.original_filename // Single guest - no subfolder needed
            : `${sanitizedGuestName}/${photo.original_filename}` // Multiple guests - organize by guest

          archive.append(buffer, { name: archivePath })
        } catch (error) {
          console.error('Error processing photo:', photo.original_filename, error)
        }
      }
    }

    // Finalize archive
    archive.finalize()

    // Create readable stream from archive
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk))
        })

        archive.on('end', () => {
          controller.close()
        })

        archive.on('error', (error) => {
          console.error('Archive error:', error)
          controller.error(error)
        })
      }
    })

    return new Response(stream, { headers })

  } catch (error) {
    console.error('ZIP download error:', error)
    return NextResponse.json({ error: 'Failed to create ZIP archive' }, { status: 500 })
  }
}