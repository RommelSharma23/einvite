// middleware.js (place in root of project, same level as package.json)
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for middleware
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function middleware(request) {
  const hostname = request.headers.get('host')
  const url = request.nextUrl
  
  // Skip middleware for these paths
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname === '/favicon.ico' ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/auth')
  ) {
    return NextResponse.next()
  }

  // Your main domain - serve normally
  if (hostname === 'einvite.onrender.com' || hostname === 'localhost:3000') {
    return NextResponse.next()
  }

  // Handle custom domains
  try {
    console.log('Custom domain detected:', hostname)
    
    // Look up the project by custom domain
    const { data: project, error } = await supabase
      .from('wedding_projects')
      .select('subdomain, id, title, is_published')
      .eq('custom_domain', hostname)
      .eq('is_published', true)
      .single()

    if (error || !project) {
      console.log('No project found for domain:', hostname)
      return new NextResponse('Website not found', { status: 404 })
    }

    console.log('Found project for custom domain:', project)

    // Rewrite to the correct wedding page
    const rewriteUrl = url.clone()
    rewriteUrl.pathname = `/${project.subdomain}${url.pathname === '/' ? '' : url.pathname}`
    
    // Add custom headers for the app to know it's a custom domain
    const response = NextResponse.rewrite(rewriteUrl)
    response.headers.set('x-custom-domain', hostname)
    response.headers.set('x-project-subdomain', project.subdomain)
    
    console.log('Rewriting to:', rewriteUrl.pathname)
    return response

  } catch (error) {
    console.error('Middleware error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - dashboard (admin routes)
     * - auth (authentication routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|dashboard|auth).*)',
  ],
}