// File: src/app/api/photo-upload/sessions/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Test endpoint
export async function GET() {
  return NextResponse.json({ message: 'Sessions API is working' })
}

// Create upload session
export async function POST(request: NextRequest) {
  try {
    console.log('=== SESSION CREATION API START ===')
    const body = await request.json()
    console.log('Request body:', body)
    const { bucket_id, guest_name, guest_email } = body

    if (!bucket_id || !guest_name || !guest_email) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Bucket ID, guest name, and email are required' },
        { status: 400 }
      )
    }

    // Get bucket and project info using regular client (public read access)
    const { data: bucket, error: bucketError } = await supabase
      .from('guest_upload_buckets')
      .select('project_id, is_active, expires_at, max_images_per_guest')
      .eq('id', bucket_id)
      .single()

    if (bucketError || !bucket) {
      console.error('Bucket query error:', bucketError)
      return NextResponse.json({ 
        error: 'Bucket not found',
        details: bucketError?.message,
        code: bucketError?.code 
      }, { status: 404 })
    }

    if (!bucket.is_active) {
      return NextResponse.json({ error: 'Upload bucket is not active' }, { status: 400 })
    }

    if (bucket.expires_at && new Date(bucket.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Upload bucket has expired' }, { status: 400 })
    }

    // Get device info from headers
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              '0.0.0.0'

    // Create session
    console.log('Attempting to create session with data:', {
      bucket_id,
      project_id: bucket.project_id,
      guest_name,
      guest_email,
      ip_address: ip
    })

    // Check if a session already exists for this email and bucket
    console.log('Checking for existing session...')
    const { data: existingSession, error: existingSessionError } = await supabaseAdmin
      .from('guest_upload_sessions')
      .select(`
        *,
        guest_uploads:guest_uploads(
          id, original_filename, file_url, thumbnail_url, uploaded_at, file_size
        )
      `)
      .eq('bucket_id', bucket_id)
      .eq('guest_email', guest_email)
      .eq('session_status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single()

    console.log('Existing session check:', { existingSession, existingSessionError })

    if (existingSession && !existingSessionError) {
      console.log('Returning existing session')
      return NextResponse.json({ 
        session: existingSession,
        max_images: bucket.max_images_per_guest,
        existing_uploads: existingSession.guest_uploads || [],
        is_resuming: true
      })
    }

    // Create new session if none exists
    console.log('Creating new session...')
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('guest_upload_sessions')
      .insert({
        bucket_id,
        project_id: bucket.project_id,
        guest_name,
        guest_email,
        ip_address: ip,
        user_agent: userAgent
      })
      .select()
      .single()

    console.log('Session creation result:', { session, sessionError })

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json({ 
        error: 'Failed to create session',
        details: sessionError.message,
        code: sessionError.code 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      session,
      max_images: bucket.max_images_per_guest,
      existing_uploads: [],
      is_resuming: false
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}