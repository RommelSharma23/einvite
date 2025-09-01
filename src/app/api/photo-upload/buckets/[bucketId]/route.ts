// File: src/app/api/photo-upload/buckets/[bucketId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Update bucket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { bucketId: string } }
) {
  try {
    const { bucketId } = params
    const body = await request.json()
    
    const { data: bucket, error } = await supabase
      .from('guest_upload_buckets')
      .update(body)
      .eq('id', bucketId)
      .select()
      .single()

    if (error) {
      console.error('Error updating bucket:', error)
      return NextResponse.json({ error: 'Failed to update bucket' }, { status: 500 })
    }

    return NextResponse.json({ bucket })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete bucket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bucketId: string } }
) {
  try {
    const { bucketId } = params

    const { error } = await supabase
      .from('guest_upload_buckets')
      .delete()
      .eq('id', bucketId)

    if (error) {
      console.error('Error deleting bucket:', error)
      return NextResponse.json({ error: 'Failed to delete bucket' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}