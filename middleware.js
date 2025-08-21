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
// - root (/)
// - /john-jane-wedding (or any subdomain project path)
// - Next.js assets, favicon, static, images
// - auth routes themselves
const PUBLIC_PATHS = [
  /^\/$/,                             // root
  /^\/[a-z0-9-]+(?:\/.*)?$/i,         // wedding project subdomain pages
  /^\/_next\/.*/i,                    // Next.js internals
  /^\/favicon\.ico$/i,
  /^\/static\/.*/i,
  /^\/images\/.*/i,
  /^\/auth\/.*/i                      // login, signup, etc.
];

function isPublic(path) {
  return PUBLIC_PATHS.some((r) => r.test(path));
}

export async function middleware(request) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // ✅ Always allow public paths
  if (isPublic(url.pathname)) {
    return NextResponse.next();
  }

  // ✅ On your main host/local dev, skip custom-domain logic
  if (
    hostname === 'einvite.onrender.com' ||
    hostname.startsWith('localhost')
  ) {
    return NextResponse.next();
  }

  // ✅ Handle custom domains (like havendrop.shop)
  const { data: project, error } = await supabase
    .from('wedding_projects_public')
    .select('subdomain,is_published')
    .eq('custom_domain', hostname)
    .eq('is_published', true)
    .single();

  if (error || !project) {
    return new NextResponse('Website not found', { status: 404 });
  }

  // ✅ Rewrite to project subdomain path
  // e.g. havendrop.shop -> /john-jane-wedding
  const rewriteUrl = url.clone();
  rewriteUrl.pathname = `/${project.subdomain}${
    url.pathname === '/' ? '' : url.pathname
  }`;

  const res = NextResponse.rewrite(rewriteUrl);
  res.headers.set('x-public-route', '1');
  res.headers.set('x-custom-domain', hostname);
  res.headers.set('x-project-subdomain', project.subdomain);
  return res;
}

export const config = {
  // Don’t run on static assets/APIs/images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
