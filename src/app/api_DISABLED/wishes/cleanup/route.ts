// File: src/app/api/wishes/cleanup/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Cleanup API route to remove old rate limit records
// This should be called periodically (e.g., via cron job)
export async function POST(request: NextRequest) {
  try {
    // Verify request is from internal source (you might want to add API key validation)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete rate limit records older than 24 hours with low submission counts
    const { error: cleanupError } = await supabaseAdmin!
      .from('wish_rate_limits')
      .delete()
      .lt('last_submission', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .lt('submission_count', 3)

    if (cleanupError) {
      console.error('Cleanup error:', cleanupError)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }

    // Also cleanup very old records regardless of count (older than 7 days)
    const { error: oldRecordsError } = await supabaseAdmin!
      .from('wish_rate_limits')
      .delete()
      .lt('last_submission', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (oldRecordsError) {
      console.error('Old records cleanup error:', oldRecordsError)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Rate limit records cleaned up successfully'
    })

  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}