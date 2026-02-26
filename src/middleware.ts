import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'adminAuth';
const MAX_LOGIN_AGE_HOURS = 24;

// Routes that require authentication (admin area only)
const protectedRoutes = ['/admin'];
// Routes that should redirect to admin if already authenticated
const authRoutes = ['/admin/login'];
const NEXT_AUTH_API_PREFIX = '/api/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow NextAuth to handle its own routing and HTML redirects
  if (pathname.startsWith(NEXT_AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  if (isDirectApiNavigation(request, pathname)) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  // Check for admin auth token in cookies (signed HttpOnly cookie)
  const adminAuthCookie = request.cookies.get(COOKIE_NAME);

  // Middleware runs on Edge runtime, so avoid Node crypto dependency here.
  // We perform a lightweight structural check and let /api/auth/verify do full signature verification.
  const isAuthenticated = adminAuthCookie?.value
    ? isLikelyValidAuthCookie(adminAuthCookie.value)
    : false;

  // If trying to access protected routes without valid auth
  // But exclude the login page itself from this check
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Skip redirect if already on login page to avoid infinite loop
  const isLoginPage = pathname === '/admin/login';

  if (isProtectedRoute && !isAuthenticated && !isLoginPage) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and trying to access login page, redirect to admin
  const isAuthRoute = authRoutes.includes(pathname);
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

function isDirectApiNavigation(request: NextRequest, pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return false;
  if (pathname.startsWith(NEXT_AUTH_API_PREFIX)) return false;

  const fetchMode = (request.headers.get('sec-fetch-mode') || '').toLowerCase();
  const fetchDest = (request.headers.get('sec-fetch-dest') || '').toLowerCase();
  const accept = (request.headers.get('accept') || '').toLowerCase();
  const requestedWith = (request.headers.get('x-requested-with') || '').toLowerCase();

  if (requestedWith === 'xmlhttprequest') return false;
  if (fetchMode === 'navigate') return true;
  if (fetchDest === 'document') return true;
  if (accept.includes('text/html')) return true;

  return false;
}

function isLikelyValidAuthCookie(rawValue: string): boolean {
  const candidates = [rawValue];
  try {
    const decoded = decodeURIComponent(rawValue);
    if (decoded !== rawValue) {
      candidates.push(decoded);
    }
  } catch {
    // Ignore decode errors and continue with raw value.
  }

  for (const value of candidates) {
    try {
      const parsed = JSON.parse(value) as { d?: string; s?: string };
      if (!parsed || typeof parsed.d !== 'string' || typeof parsed.s !== 'string') {
        continue;
      }

      const payload = JSON.parse(parsed.d) as { email?: string; role?: string; loginTime?: string };
      if (!payload?.email || !payload?.role || !payload?.loginTime) {
        continue;
      }

      const loginAt = new Date(payload.loginTime).getTime();
      if (!Number.isFinite(loginAt)) {
        continue;
      }

      const hoursSinceLogin = (Date.now() - loginAt) / (1000 * 60 * 60);
      if (hoursSinceLogin > MAX_LOGIN_AGE_HOURS) {
        continue;
      }

      return true;
    } catch {
      // Try next candidate.
    }
  }

  return false;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
};
