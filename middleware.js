// middleware.js (root of project)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: never use SERVICE_ROLE in middleware.
// Use the public anon key + RLS-protected view.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Public paths (allowed without auth)
// - root
// - /john-jane-wedding and anything deeper (any slug: /[subdomain])
// - next assets, favicon, static, images, auth routes themselves
const PUBLIC_PATHS = [
  /^\/$/,                             
  /^\/[a-z0-9-]+(?:\/.*)?$/i,         
  /^\/_next\/.*/i,
  /^\/favicon\.ico$/i,
  /^\/static\/.*/i,
  /^\/images\/.*/i,
  /^\/auth\/.*/i
];

function isPublic(path) {
  return PUBLIC_PATHS.some((r) => r.test(path));
}

export async function middleware(request) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Always allow public paths through (prevents /auth/login redirect loops)
  if (isPublic(url.pathname)) {
    return NextResponse.next();
  }

  // On your main host/local dev, let Next handle normally
  if (hostname === 'einvite.onrender.com' || hostname.startsWith('localhost')) {
    return NextResponse.next();
  }

  // For custom domains, map to the project's subdomain if published
  const { data: project, error } = await supabase
    // Create this view with RLS allowing select where is_published = true
    .from('wedding_projects_public')
    .select('subdomain,is_published')
    .eq('custom_domain', hostname)
    .eq('is_published', true)
    .single();

  if (error || !project) {
    return new NextResponse('Website not found', { status: 404 });
  }

  // Keep deep paths: /photos -> /john-jane-wedding/photos
  const rewriteUrl = url.clone();
  rewriteUrl.pathname = `/${project.subdomain}${url.pathname === '/' ? '' : url.pathname}`;

  const res = NextResponse.rewrite(rewriteUrl);
  // Signal to your app/layout that this is a public page
  res.headers.set('x-public-route', '1');
  res.headers.set('x-custom-domain', hostname);
  res.headers.set('x-project-subdomain', project.subdomain);
  return res;
}

export const config = {
  // Don’t run on static assets/APIs/images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
