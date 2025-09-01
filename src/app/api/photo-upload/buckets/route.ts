// File: src/app/api/photo-upload/buckets/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Get all buckets for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const { data: buckets, error } = await supabase
      .from('guest_upload_buckets')
      .select(`
        *,
        qr_code_configs (*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching buckets:', error)
      return NextResponse.json({ error: 'Failed to fetch buckets' }, { status: 500 })
    }

    return NextResponse.json({ buckets })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create a new bucket
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/photo-upload/buckets - Request received')
    
    if (!supabaseAdmin) {
      console.error('Supabase Admin client not available - missing service role key')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const { 
      project_id, 
      bucket_name, 
      bucket_description,
      max_images_per_guest = 30,
      max_file_size_mb = 10,
      expires_at,
      user_id // We'll need to pass this from the frontend
    } = body

    console.log('Parsed data:', { project_id, bucket_name, bucket_description, max_images_per_guest, max_file_size_mb, user_id })

    if (!project_id || !bucket_name || !user_id) {
      console.log('Missing required fields:', { project_id: !!project_id, bucket_name: !!bucket_name, user_id: !!user_id })
      return NextResponse.json(
        { error: 'Project ID, bucket name, and user ID are required' }, 
        { status: 400 }
      )
    }

    // Verify user owns the project using admin client (bypasses RLS)
    const { data: project, error: projectError } = await supabaseAdmin
      .from('wedding_projects')
      .select('id, user_id')
      .eq('id', project_id)
      .eq('user_id', user_id)
      .single()

    if (projectError || !project) {
      console.log('Project ownership verification failed:', projectError)
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 })
    }

    console.log('Project ownership verified:', project.id)

    // Use existing Guest_upload bucket with organized folder structure
    const storage_bucket_name = 'Guest_upload'
    const storage_path = `project-${project_id}/${bucket_name.toLowerCase().replace(/\s+/g, '-')}/`
    console.log('Using storage bucket:', storage_bucket_name)
    console.log('Generated storage path:', storage_path)

    // Create bucket using admin client (bypasses RLS)
    console.log('Creating bucket in database...')
    const { data: bucket, error: bucketError } = await supabaseAdmin
      .from('guest_upload_buckets')
      .insert({
        project_id,
        bucket_name,
        bucket_description,
        max_images_per_guest,
        max_file_size_mb,
        storage_path,
        expires_at
      })
      .select()
      .single()

    if (bucketError) {
      console.error('Supabase Error creating bucket:', bucketError)
      return NextResponse.json({ error: `Database error: ${bucketError.message}` }, { status: 500 })
    }

    console.log('Bucket created successfully:', bucket)

    // Create folder structure in existing Guest_upload bucket
    console.log('Setting up folder structure in Guest_upload bucket...')
    try {
      // Create a placeholder file to establish the folder structure
      const placeholderContent = new Blob(['This folder is for guest photo uploads'], { type: 'text/plain' })
      const placeholderPath = `${storage_path}.keep`
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from(storage_bucket_name)
        .upload(placeholderPath, placeholderContent, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.log('Note: Could not create placeholder file, but this is not critical:', uploadError.message)
      } else {
        console.log('Folder structure created successfully:', storage_path)
      }

      console.log('Storage folder setup completed')
    } catch (storageSetupError) {
      console.error('Error setting up storage folder:', storageSetupError)
      // Continue without failing the bucket creation
    }

    // Create default QR code config using admin client
    const { data: qrConfig, error: qrError } = await supabaseAdmin
      .from('qr_code_configs')
      .insert({
        bucket_id: bucket.id,
        project_id: project_id,
        content_title: bucket_name,
        content_subtitle: 'Share Your Memories',
        content_instructions: 'Scan to upload photos from our special day!'
      })
      .select()
      .single()

    if (qrError) {
      console.error('Error creating QR config:', qrError)
      // Don't fail the bucket creation if QR config fails
    }

    return NextResponse.json({ 
      bucket: {
        ...bucket,
        qr_code_configs: qrConfig ? [qrConfig] : []
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}