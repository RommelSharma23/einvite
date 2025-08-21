// middleware.js (root of project)
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use anon key only (NEVER service_role in middleware)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Public paths (skip auth checks)
// ❌ Removed root ("/") so it's handled by custom domain logic
const PUBLIC_PATHS = [
  /^\/[a-z0-9-]+(?:\/.*)?$/i,         // wedding project subdomain pages
  /^\/_next\/.*/i,                    // Next.js internals
  /^\/favicon\.ico$/i,
  /^\/static\/.*/i,
  /^\/images\/.*/i,
  /^\/auth\/.*/i                      // login, signup, etc.
]

function isPublic(path) {
  return PUBLIC_PATHS.some((r) => r.test(path))
}

export async function middleware(request) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // ✅ Allow public paths (wedding subdomains, assets, auth, etc.)
  if (isPublic(url.pathname)) {
    return NextResponse.next()
  }

  // ✅ Skip middleware for main host or localhost (dashboard + dev)
  if (
    hostname === 'einvite.onrender.com' ||
    hostname.startsWith('localhost')
  ) {
    return NextResponse.next()
  }

  // ✅ Handle custom domains
  const { data: project, error } = await supabase
    .from('wedding_projects_public') // RLS-protected view
    .select('subdomain,is_published')
    .eq('custom_domain', hostname)
    .eq('is_published', true)
    .single()

  if (error || !project) {
    return new NextResponse('Website not found', { status: 404 })
  }

  // ✅ Root request → redirect to project subdomain
  if (url.pathname === '/') {
    return NextResponse.redirect(
      new URL(`/${project.subdomain}`, request.url)
    )
  }

  // ✅ Deep paths → rewrite to correct project subdomain
  const rewriteUrl = url.clone()
  rewriteUrl.pathname = `/${project.subdomain}${url.pathname}`

  const res = NextResponse.rewrite(rewriteUrl)
  res.headers.set('x-public-route', '1')
  res.headers.set('x-custom-domain', hostname)
  res.headers.set('x-project-subdomain', project.subdomain)
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
