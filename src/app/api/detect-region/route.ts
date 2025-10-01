import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || request.ip || '127.0.0.1'

    console.log('🌍 Detecting region for IP:', ip)

    // For localhost/development, default to India
    if (ip === '127.0.0.1' || ip === '::1' || ip.includes('192.168.') || ip.includes('10.0.')) {
      console.log('🏠 Localhost detected, defaulting to India')
      return NextResponse.json({
        success: true,
        region: 'india',
        currency: 'INR',
        ip: ip,
        source: 'localhost_default'
      })
    }

    // Try to detect country using a free IP geolocation service
    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
        timeout: 3000 // 3 second timeout
      })

      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        console.log('🗺️ Geo data:', geoData)

        if (geoData.status === 'success') {
          const countryCode = geoData.countryCode
          const isIndia = countryCode === 'IN'

          return NextResponse.json({
            success: true,
            region: isIndia ? 'india' : 'international',
            currency: isIndia ? 'INR' : 'USD',
            country: geoData.country,
            countryCode: countryCode,
            ip: ip,
            source: 'geolocation'
          })
        }
      }
    } catch (geoError) {
      console.error('Geolocation API failed:', geoError)
    }

    // Fallback: Check browser headers for language/locale hints
    const acceptLanguage = request.headers.get('accept-language')
    const hasIndianLocale = acceptLanguage?.includes('hi') || acceptLanguage?.includes('IN')

    const fallbackRegion = hasIndianLocale ? 'india' : 'international'

    console.log('🔄 Using fallback region:', fallbackRegion)

    return NextResponse.json({
      success: true,
      region: fallbackRegion,
      currency: fallbackRegion === 'india' ? 'INR' : 'USD',
      ip: ip,
      source: 'browser_locale_fallback',
      acceptLanguage: acceptLanguage
    })

  } catch (error) {
    console.error('❌ Region detection error:', error)

    // Ultimate fallback
    return NextResponse.json({
      success: true,
      region: 'india', // Default to India
      currency: 'INR',
      source: 'error_fallback',
      error: (error as Error).message
    })
  }
}