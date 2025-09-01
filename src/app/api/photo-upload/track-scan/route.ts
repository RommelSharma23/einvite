// File: src/app/api/photo-upload/track-scan/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  browserName: string
  browserVersion: string
  osName: string
  osVersion: string
}

function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase()
  
  // Device Type Detection
  let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown'
  if (/mobile|android|iphone/.test(ua)) deviceType = 'mobile'
  else if (/tablet|ipad/.test(ua)) deviceType = 'tablet'
  else if (/desktop|windows|mac|linux/.test(ua)) deviceType = 'desktop'

  // Browser Detection
  let browserName = 'unknown'
  let browserVersion = ''
  
  if (ua.includes('chrome')) {
    browserName = 'Chrome'
    const match = ua.match(/chrome\/([0-9]+)/)
    browserVersion = match ? match[1] : ''
  } else if (ua.includes('safari')) {
    browserName = 'Safari'
    const match = ua.match(/safari\/([0-9]+)/)
    browserVersion = match ? match[1] : ''
  } else if (ua.includes('firefox')) {
    browserName = 'Firefox'
    const match = ua.match(/firefox\/([0-9]+)/)
    browserVersion = match ? match[1] : ''
  } else if (ua.includes('edge')) {
    browserName = 'Edge'
    const match = ua.match(/edge\/([0-9]+)/)
    browserVersion = match ? match[1] : ''
  }

  // OS Detection
  let osName = 'unknown'
  let osVersion = ''
  
  if (ua.includes('windows')) {
    osName = 'Windows'
    if (ua.includes('windows nt 10')) osVersion = '10'
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1'
    else if (ua.includes('windows nt 6.1')) osVersion = '7'
  } else if (ua.includes('mac os x')) {
    osName = 'macOS'
    const match = ua.match(/mac os x ([0-9_]+)/)
    osVersion = match ? match[1].replace(/_/g, '.') : ''
  } else if (ua.includes('android')) {
    osName = 'Android'
    const match = ua.match(/android ([0-9.]+)/)
    osVersion = match ? match[1] : ''
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    osName = 'iOS'
    const match = ua.match(/os ([0-9_]+)/)
    osVersion = match ? match[1].replace(/_/g, '.') : ''
  }

  return { deviceType, browserName, browserVersion, osName, osVersion }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const { bucket_id, user_agent, referrer, scan_source = 'qr_code' } = body

    if (!bucket_id) {
      return NextResponse.json({ error: 'Bucket ID is required' }, { status: 400 })
    }

    // Get IP address
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              '0.0.0.0'

    // Parse device info
    const deviceInfo = parseUserAgent(user_agent || '')

    // Get bucket and project info
    const { data: bucket } = await supabaseAdmin
      .from('guest_upload_buckets')
      .select('project_id')
      .eq('id', bucket_id)
      .single()

    if (!bucket) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    // Record the scan
    const { data: scanRecord, error: scanError } = await supabaseAdmin
      .from('qr_code_scans')
      .insert({
        bucket_id,
        project_id: bucket.project_id,
        ip_address: ip,
        user_agent: user_agent || '',
        referrer: referrer || '',
        device_type: deviceInfo.deviceType,
        browser_name: deviceInfo.browserName,
        browser_version: deviceInfo.browserVersion,
        os_name: deviceInfo.osName,
        os_version: deviceInfo.osVersion,
        scan_source: scan_source,
        scan_metadata: {
          timestamp: new Date().toISOString(),
          page_url: referrer
        }
      })
      .select()
      .single()

    if (scanError) {
      console.error('Error recording QR scan:', scanError)
      return NextResponse.json({ error: 'Failed to record scan' }, { status: 500 })
    }

    // Update bucket scan count - get current count and increment
    const { data: currentBucket } = await supabaseAdmin
      .from('guest_upload_buckets')
      .select('total_scans')
      .eq('id', bucket_id)
      .single()

    if (currentBucket) {
      await supabaseAdmin
        .from('guest_upload_buckets')
        .update({ 
          total_scans: (currentBucket.total_scans || 0) + 1,
          last_scanned_at: new Date().toISOString()
        })
        .eq('id', bucket_id)
    }

    return NextResponse.json({ 
      success: true, 
      scan_id: scanRecord.id 
    })

  } catch (error) {
    console.error('QR scan tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}