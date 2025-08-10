// File: src/app/api/wishes/check-rate-limit/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1'

    // Rate limiting rules: 3 submissions per hour per IP per project
    const RATE_LIMIT_COUNT = 3
    const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

    // Check existing rate limit record
    const { data: existingLimit } = await supabaseAdmin!
      .from('wish_rate_limits')
      .select('*')
      .eq('project_id', projectId)
      .eq('ip_address', clientIp)
      .single()

    const now = new Date()

    if (existingLimit) {
      const lastSubmission = new Date(existingLimit.last_submission)
      const timeDiff = now.getTime() - lastSubmission.getTime()

      // If within rate limit window
      if (timeDiff < RATE_LIMIT_WINDOW) {
        if (existingLimit.submission_count >= RATE_LIMIT_COUNT) {
          return NextResponse.json({
            allowed: false,
            remaining: 0,
            resetTime: new Date(lastSubmission.getTime() + RATE_LIMIT_WINDOW),
            message: 'Rate limit exceeded. Please wait before submitting another wish.'
          })
        }

        // Increment count
        await supabaseAdmin!
          .from('wish_rate_limits')
          .update({
            submission_count: existingLimit.submission_count + 1,
            last_submission: now.toISOString()
          })
          .eq('id', existingLimit.id)

        return NextResponse.json({
          allowed: true,
          remaining: RATE_LIMIT_COUNT - (existingLimit.submission_count + 1),
          resetTime: new Date(lastSubmission.getTime() + RATE_LIMIT_WINDOW)
        })
      } else {
        // Reset counter if window expired
        await supabaseAdmin!
          .from('wish_rate_limits')
          .update({
            submission_count: 1,
            last_submission: now.toISOString()
          })
          .eq('id', existingLimit.id)

        return NextResponse.json({
          allowed: true,
          remaining: RATE_LIMIT_COUNT - 1,
          resetTime: new Date(now.getTime() + RATE_LIMIT_WINDOW)
        })
      }
    } else {
      // Create new rate limit record
      await supabaseAdmin!
        .from('wish_rate_limits')
        .insert({
          project_id: projectId,
          ip_address: clientIp,
          submission_count: 1,
          last_submission: now.toISOString()
        })

      return NextResponse.json({
        allowed: true,
        remaining: RATE_LIMIT_COUNT - 1,
        resetTime: new Date(now.getTime() + RATE_LIMIT_WINDOW)
      })
    }

  } catch (error) {
    console.error('Rate limit check error:', error)
    
    // Allow submission on error to avoid blocking legitimate users
    return NextResponse.json({
      allowed: true,
      remaining: 3,
      resetTime: new Date(Date.now() + 60 * 60 * 1000),
      message: 'Rate limit check failed, allowing submission'
    })
  }
}