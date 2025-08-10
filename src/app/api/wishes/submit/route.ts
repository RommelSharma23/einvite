// File: src/app/api/wishes/submit/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

interface SpamDetectionResult {
  isSpam: boolean
  spamScore: number
  reasons: string[]
}

// Spam detection function
function detectSpam(message: string, name: string): SpamDetectionResult {
  let spamScore = 0
  const reasons: string[] = []
  const text = `${name} ${message}`.toLowerCase()

  // URL detection
  const urlPatterns = [
    /https?:\/\/[^\s]+/gi,
    /www\.[^\s]+/gi,
    /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/gi
  ]
  
  urlPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      spamScore += matches.length * 4
      reasons.push('Contains URLs or web addresses')
    }
  })

  // Spam keywords
  const spamKeywords = [
    'click here', 'buy now', 'free money', 'winner', 'congratulations you won',
    'viagra', 'casino', 'lottery', 'debt', 'credit card', 'loan', 'investment',
    'make money', 'work from home', 'get rich', 'limited time', 'act now'
  ]

  spamKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      spamScore += 3
      reasons.push(`Contains spam keyword: ${keyword}`)
    }
  })

  // Excessive capitalization (more than 70% caps in messages over 20 chars)
  if (message.length > 20) {
    const capsCount = (message.match(/[A-Z]/g) || []).length
    const capsRatio = capsCount / message.length
    if (capsRatio > 0.7) {
      spamScore += 2
      reasons.push('Excessive use of capital letters')
    }
  }

  // Excessive punctuation
  const punctCount = (message.match(/[!@#$%^&*()_+=\[\]{}|;:,.<>?]/g) || []).length
  if (punctCount > message.length * 0.3 && punctCount > 10) {
    spamScore += 2
    reasons.push('Excessive punctuation')
  }

  // Repeated characters (like "aaaaaaa" or "!!!!!!!!")
  const repeatedChars = message.match(/(.)\1{4,}/g)
  if (repeatedChars && repeatedChars.length > 0) {
    spamScore += 1
    reasons.push('Contains repeated characters')
  }

  // Very short messages (potential spam)
  if (message.trim().length < 10) {
    spamScore += 1
    reasons.push('Message too short')
  }

  // Very long messages (potential spam)
  if (message.length > 1000) {
    spamScore += 1
    reasons.push('Message too long')
  }

  // Numbers and special characters ratio
  const numbersAndSpecial = (message.match(/[0-9@#$%^&*()_+=\[\]{}|;:,.<>?]/g) || []).length
  const ratio = numbersAndSpecial / message.length
  if (ratio > 0.5 && message.length > 20) {
    spamScore += 2
    reasons.push('Too many numbers and special characters')
  }

  return {
    isSpam: spamScore > 5,
    spamScore,
    reasons
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, guestName, message, guestEmail } = body

    // Validation
    if (!projectId || !guestName?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if project exists and wishes are enabled
    const { data: project } = await supabase
      .from('wedding_projects')
      .select('id, is_published')
      .eq('id', projectId)
      .eq('is_published', true)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or not published' },
        { status: 404 }
      )
    }

    // Check wishes configuration
    const { data: config } = await supabase
      .from('wishes_config')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (config && !config.is_enabled) {
      return NextResponse.json(
        { error: 'Guest wishes are disabled for this wedding' },
        { status: 403 }
      )
    }

    // Validate message length
    const maxLength = config?.max_message_length || 500
    if (message.length > maxLength) {
      return NextResponse.json(
        { error: `Message must be less than ${maxLength} characters` },
        { status: 400 }
      )
    }

    // Validate email if required
    if (config?.require_email && !guestEmail?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Email format validation if provided
    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1'

    // Check rate limiting
    const rateLimitResponse = await fetch(`${request.nextUrl.origin}/api/wishes/check-rate-limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    })

    const rateLimitResult = await rateLimitResponse.json()
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: rateLimitResult.message,
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      )
    }

    // Spam detection
    const spamResult = detectSpam(message, guestName)
    
    // Determine status based on spam score
    // Auto-approve safe messages, moderate suspicious ones
    const status = spamResult.isSpam ? 'pending' : 'approved'

    // Insert wish into database
    const { data: newWish, error: insertError } = await supabaseAdmin!
      .from('guest_wishes')
      .insert({
        project_id: projectId,
        guest_name: guestName.trim(),
        message: message.trim(),
        guest_email: guestEmail?.trim() || null,
        status,
        spam_score: spamResult.spamScore,
        ip_address: clientIp
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting wish:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit wish' },
        { status: 500 }
      )
    }

    // Log spam detection if suspicious
    if (spamResult.isSpam) {
      console.log(`Suspicious wish submitted for project ${projectId}:`, {
        spamScore: spamResult.spamScore,
        reasons: spamResult.reasons,
        ip: clientIp,
        guestName,
        message: message.substring(0, 100) + '...'
      })
    }

    return NextResponse.json({
      success: true,
      status,
      message: status === 'approved' 
        ? 'Your wish has been posted successfully!'
        : 'Thank you! Your wish is being reviewed and will appear shortly.',
      wish: newWish,
      spamScore: spamResult.spamScore,
      remaining: rateLimitResult.remaining
    })

  } catch (error) {
    console.error('Wish submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}