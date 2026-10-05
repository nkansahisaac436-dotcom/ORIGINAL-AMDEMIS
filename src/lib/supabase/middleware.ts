import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // If env variables are not yet configured (e.g. initial setup before env is set), pass through
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Static assets, api routes, branding, manifest bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/branding') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('manifest.json') ||
    pathname.includes('sw.js')
  ) {
    return supabaseResponse;
  }

  // Not logged in
  if (!user) {
    if (pathname.startsWith('/headteacher') || pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // User is logged in, query their profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_initial_pin')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  // If at root '/' or login page, redirect to appropriate area
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    if (role === 'headteacher') {
      url.pathname = '/headteacher/dashboard';
      return NextResponse.redirect(url);
    } else if (role === 'super_admin' || role === 'district_officer') {
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Protect Headteacher routes
  if (pathname.startsWith('/headteacher') && role !== 'headteacher') {
    const url = request.nextUrl.clone();
    url.pathname = role ? '/admin/dashboard' : '/';
    return NextResponse.redirect(url);
  }

  // Protect Admin routes
  if (pathname.startsWith('/admin') && role !== 'super_admin' && role !== 'district_officer') {
    const url = request.nextUrl.clone();
    url.pathname = role === 'headteacher' ? '/headteacher/dashboard' : '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
