// File: src/app/api/photo-upload/gallery/[bucketId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface GalleryPhoto {
  id: string
  original_filename: string
  stored_filename: string
  file_url: string
  thumbnail_url?: string
  file_size: number
  uploaded_at: string
  upload_order: number
}

interface GuestGallery {
  guest_name: string
  guest_email: string
  session_id: string
  total_images: number
  photos: GalleryPhoto[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: { bucketId: string } }
) {
  try {
    const bucketId = params.bucketId

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Verify bucket exists and get bucket info
    const { data: bucket, error: bucketError } = await supabaseAdmin
      .from('guest_upload_buckets')
      .select('id, bucket_name, project_id')
      .eq('id', bucketId)
      .single()

    if (bucketError || !bucket) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    // Get all sessions for this bucket with their uploads
    const { data: sessionsData, error: sessionsError } = await supabaseAdmin
      .from('guest_upload_sessions')
      .select(`
        id,
        guest_name,
        guest_email,
        created_at,
        total_images,
        guest_uploads (
          id,
          original_filename,
          stored_filename,
          file_url,
          thumbnail_url,
          file_size,
          uploaded_at,
          upload_order
        )
      `)
      .eq('bucket_id', bucketId)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching gallery data:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch gallery data' }, { status: 500 })
    }

    // Transform data into gallery format
    const galleryData: GuestGallery[] = (sessionsData || [])
      .filter(session => session.guest_uploads && session.guest_uploads.length > 0)
      .map(session => ({
        guest_name: session.guest_name,
        guest_email: session.guest_email,
        session_id: session.id,
        total_images: session.guest_uploads?.length || 0,
        photos: (session.guest_uploads || [])
          .sort((a, b) => a.upload_order - b.upload_order)
          .map(upload => ({
            id: upload.id,
            original_filename: upload.original_filename,
            stored_filename: upload.stored_filename,
            file_url: upload.file_url,
            thumbnail_url: upload.thumbnail_url,
            file_size: upload.file_size,
            uploaded_at: upload.uploaded_at,
            upload_order: upload.upload_order
          }))
      }))

    // Calculate totals
    const totalGuests = galleryData.length
    const totalImages = galleryData.reduce((sum, guest) => sum + guest.total_images, 0)
    const totalSizeBytes = galleryData.reduce((sum, guest) => 
      sum + guest.photos.reduce((photoSum, photo) => photoSum + photo.file_size, 0), 0
    )

    return NextResponse.json({
      bucket: {
        id: bucket.id,
        name: bucket.bucket_name,
        project_id: bucket.project_id
      },
      stats: {
        total_guests: totalGuests,
        total_images: totalImages,
        total_size_bytes: totalSizeBytes,
        total_size_mb: Math.round(totalSizeBytes / (1024 * 1024) * 100) / 100
      },
      guests: galleryData
    })

  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}