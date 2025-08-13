// File: src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { redirectCache } from '@/lib/redirect-cache'

/**
 * Next.js Middleware for handling custom domain redirects
 * Runs on edge before any page loads for maximum performance
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''

  // Skip middleware for certain paths to avoid interference
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next()
  }

  try {
    // Handle custom domain requests (not on einvite.com)
    if (isCustomDomain(hostname)) {
      return handleCustomDomainRequest(request, hostname, pathname, search)
    }

    // Handle subdomain redirect checks (on einvite.com)
    if (isSubdomainPath(pathname)) {
      return await handleSubdomainRedirect(request, pathname, search, userAgent, referer)
    }

    // Continue normally for other requests
    return NextResponse.next()

  } catch (error) {
    console.error('Middleware error:', error)
    // On error, always continue to avoid breaking the website
    return NextResponse.next()
  }
}

/**
 * Check if we should skip middleware for this path
 */
function shouldSkipMiddleware(pathname: string): boolean {
  const skipPaths = [
    '/api/',           // API routes
    '/_next/',         // Next.js internal
    '/favicon.ico',    // Favicon
    '/robots.txt',     // SEO files
    '/sitemap.xml',    // SEO files
    '/.well-known/',   // Well-known files
    '/health',         // Health check
    '/ping',           // Ping endpoint
    '/admin/',         // Admin panel
    '/dashboard/',     // User dashboard
    '/editor/',        // Editor interface
    '/auth/',          // Authentication
    '/preview/',       // Preview pages
  ]

  return skipPaths.some(path => pathname.startsWith(path))
}

/**
 * Check if the hostname is a custom domain (not einvite.com)
 */
function isCustomDomain(hostname: string): boolean {
  // Your main domain patterns
  const mainDomains = [
    'einvite.com',
    'www.einvite.com',
    'localhost',
    '127.0.0.1'
  ]

  // Check if it's NOT one of your main domains
  return !mainDomains.some(domain => 
    hostname === domain || 
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.includes('.vercel.app') ||
    hostname.includes('.render.com')
  )
}

/**
 * Check if the path is a subdomain wedding website path
 */
function isSubdomainPath(pathname: string): boolean {
  // Pattern: /john-jane-wedding or /couple-name-123456
  // Must be root level path with no additional segments for published sites
  return /^\/[a-z0-9-]+-[a-z0-9-]+-[a-z0-9]+\/?$/.test(pathname)
}

/**
 * Create Supabase client for middleware
 */
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
/**
 * Handle requests to custom domains
 * Serve the wedding website content for the custom domain
 */
async function handleCustomDomainRequest(
  request: NextRequest,
  hostname: string,
  pathname: string,
  search: string
): Promise<NextResponse> {
  try {
    console.log(`Custom domain request: ${hostname}${pathname}`)

    // Create Supabase client for middleware
    const supabase = createSupabaseClient()

    // Find the project associated with this custom domain
    const { data: domainConfig, error } = await supabase
      .from('domain_config')
      .select(`
        id,
        custom_domain,
        domain_status,
        redirect_enabled,
        wedding_projects!inner(
          id,
          subdomain,
          is_published,
          title
        )
      `)
      .eq('custom_domain', hostname)
      .eq('domain_status', 'verified')
      .eq('wedding_projects.is_published', true)
      .single()

    if (error || !domainConfig) {
      console.log(`No verified domain config found for: ${hostname}`)
      return new NextResponse('Domain not found', { status: 404 })
    }

    // Type the wedding_projects as single object (due to !inner join)
    const weddingProject = domainConfig.wedding_projects as unknown as {
      id: string
      subdomain: string
      is_published: boolean
      title: string
    }

    // Rewrite to the subdomain path to serve the content
    const subdomain = weddingProject.subdomain
    const rewriteUrl = new URL(`/${subdomain}${pathname}${search}`, request.url)
    
    console.log(`Rewriting ${hostname}${pathname} to /${subdomain}${pathname}`)

    // Track analytics for custom domain visits
    await trackCustomDomainVisit(supabase, domainConfig.id, request)

    // Rewrite the request to serve content from subdomain path
    return NextResponse.rewrite(rewriteUrl)

  } catch (error) {
    console.error(`Error handling custom domain ${hostname}:`, error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

/**
 * Handle subdomain redirect checks
 * Check if subdomain should redirect to custom domain
 */
async function handleSubdomainRedirect(
  request: NextRequest,
  pathname: string,
  search: string,
  userAgent: string,
  referer: string
): Promise<NextResponse> {
  // Extract subdomain from pathname
  const subdomain = pathname.slice(1).replace(/\/$/, '') // Remove leading slash and trailing slash
  
  console.log(`Checking redirect for subdomain: ${subdomain}`)

  // First check cache for fast response
  const cachedRedirectUrl = redirectCache.getRedirectUrl(subdomain)
  
  if (cachedRedirectUrl) {
    console.log(`Cache hit: Redirecting ${subdomain} to ${cachedRedirectUrl}`)
    
    // Log redirect for analytics (non-blocking)
    logRedirect(subdomain, cachedRedirectUrl, userAgent, referer, true)
    
    // Perform 301 permanent redirect
    return NextResponse.redirect(cachedRedirectUrl, {
      status: 301,
      headers: {
        'Cache-Control': 'public, max-age=3600, immutable', // Cache redirect for 1 hour
        'X-Redirect-Source': 'cache',
        'X-Original-Subdomain': subdomain
      }
    })
  }

  // Cache miss - check database
  try {
    const supabase = createSupabaseClient()
    
    // Use the database function for optimized lookup
    const { data: redirectUrl, error } = await supabase
      .rpc('get_redirect_url', { subdomain_param: subdomain })

    if (error) {
      console.error('Database error checking redirect:', error)
      return NextResponse.next()
    }

    if (redirectUrl) {
      console.log(`Database hit: Redirecting ${subdomain} to ${redirectUrl}`)
      
      // Update cache for future requests
      const customDomain = redirectUrl.replace('https://', '')
      redirectCache.setRedirect(subdomain, customDomain, true)
      
      // Log redirect for analytics (non-blocking)
      logRedirect(subdomain, redirectUrl, userAgent, referer, false)
      
      // Perform 301 permanent redirect
      return NextResponse.redirect(redirectUrl, {
        status: 301,
        headers: {
          'Cache-Control': 'public, max-age=3600, immutable',
          'X-Redirect-Source': 'database',
          'X-Original-Subdomain': subdomain
        }
      })
    }

    // No redirect configured - update cache to avoid future DB calls
    redirectCache.setRedirect(subdomain, null, false)
    console.log(`No redirect configured for subdomain: ${subdomain}`)

  } catch (error) {
    console.error('Error checking redirect in database:', error)
    // Continue to serve the page normally on database error
  }

  // No redirect needed - continue to serve the subdomain page
  return NextResponse.next()
}

/**
 * Track custom domain visits for analytics
 */
async function trackCustomDomainVisit(
  supabase: ReturnType<typeof createSupabaseClient>,
  domainConfigId: string,
  request: NextRequest
): Promise<void> {
  try {
    // Don't block the response for analytics
    const visitData = {
      domain_config_id: domainConfigId,
      visitor_ip: getClientIP(request),
      user_agent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      pathname: request.nextUrl.pathname,
      visited_at: new Date().toISOString()
    }

    // Fire and forget - don't await this
    supabase
      .from('domain_visits')
      .insert(visitData)
      .then(({ error }: { error: Error | null }) => {
        if (error) {
          console.error('Error tracking domain visit:', error)
        }
      })

  } catch (error) {
    console.error('Error in trackCustomDomainVisit:', error)
  }
}

/**
 * Log redirect for analytics (non-blocking)
 */
function logRedirect(
  fromSubdomain: string,
  toUrl: string,
  userAgent: string,
  referer: string,
  fromCache: boolean
): void {
  // Use setTimeout to make this truly non-blocking
  setTimeout(async () => {
    try {
      // In a real implementation, you might:
      // 1. Send to analytics service
      // 2. Log to database
      // 3. Send to monitoring service
      
      console.log('Redirect Analytics:', {
        from: fromSubdomain,
        to: toUrl,
        userAgent: userAgent.substring(0, 100), // Truncate for logging
        referer,
        fromCache,
        timestamp: new Date().toISOString()
      })

      // Example: Send to analytics API
      // await fetch('/api/analytics/redirect', {
      //   method: 'POST',
      //   body: JSON.stringify({ fromSubdomain, toUrl, fromCache })
      // })

    } catch (error) {
      console.error('Error logging redirect:', error)
    }
  }, 0)
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cloudflareIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (cloudflareIP) {
    return cloudflareIP
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

/**
 * Configuration for which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|health|ping).*)',
  ],
}