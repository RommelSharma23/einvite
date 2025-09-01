// File: src/app/api/photo-upload/upload/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Upload files to session
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const sessionToken = formData.get('session_token') as string
    const files = formData.getAll('files') as File[]

    if (!sessionToken || files.length === 0) {
      return NextResponse.json(
        { error: 'Session token and files are required' },
        { status: 400 }
      )
    }

    // Get session info using admin client to bypass RLS
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('guest_upload_sessions')
      .select(`
        *,
        bucket:guest_upload_buckets (
          max_images_per_guest,
          max_file_size_mb,
          storage_path
        )
      `)
      .eq('session_token', sessionToken)
      .eq('session_status', 'active')
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 400 })
    }

    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 400 })
    }

    // Check upload limits
    const maxImages = session.bucket.max_images_per_guest
    const maxFileSize = session.bucket.max_file_size_mb * 1024 * 1024 // Convert to bytes

    if (session.total_images + files.length > maxImages) {
      return NextResponse.json(
        { error: `Maximum ${maxImages} images allowed per guest` },
        { status: 400 }
      )
    }

    const uploadedFiles = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Check file size
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Max size: ${session.bucket.max_file_size_mb}MB` },
          { status: 400 }
        )
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: `File ${file.name} is not an image` },
          { status: 400 }
        )
      }

      // Create guest session folder path
      const sanitizedGuestName = session.guest_name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const sessionFolderName = `session-${session.id}-${sanitizedGuestName}`
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${session.bucket.storage_path}${sessionFolderName}/${fileName}`

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('Guest_upload')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        continue
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('Guest_upload')
        .getPublicUrl(filePath)

      // Save file record
      const { data: fileRecord, error: fileError } = await supabaseAdmin
        .from('guest_uploads')
        .insert({
          session_id: session.id,
          original_filename: file.name,
          stored_filename: fileName,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
          mime_type: file.type,
          upload_order: session.total_images + i + 1
        })
        .select()
        .single()

      if (!fileError && fileRecord) {
        uploadedFiles.push(fileRecord)
      }
    }

    return NextResponse.json({ 
      uploaded: uploadedFiles.length,
      files: uploadedFiles
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}