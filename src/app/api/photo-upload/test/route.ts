// File: src/app/api/photo-upload/test/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Test endpoint to verify Supabase connection and table access
export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('wedding_projects')
      .select('id, title')
      .limit(1)

    if (testError) {
      console.error('Error accessing wedding_projects:', testError)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message 
      }, { status: 500 })
    }

    console.log('Wedding projects test successful:', testData)

    // Test guest_upload_buckets table access
    const { data: bucketTest, error: bucketError } = await supabase
      .from('guest_upload_buckets')
      .select('id')
      .limit(1)

    if (bucketError) {
      console.error('Error accessing guest_upload_buckets:', bucketError)
      return NextResponse.json({ 
        error: 'Bucket table access failed', 
        details: bucketError.message 
      }, { status: 500 })
    }

    console.log('Bucket table test successful')

    return NextResponse.json({ 
      success: true,
      message: 'Supabase connection working',
      wedding_projects_count: testData?.length || 0,
      bucket_table_accessible: true
    })
  } catch (error) {
    console.error('Test API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}