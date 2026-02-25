import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'adminAuth';
const MAX_LOGIN_AGE_HOURS = 24;

// Routes that require authentication
const protectedRoutes = ['/admin'];
// Routes that should redirect to admin if already authenticated
const authRoutes = ['/admin/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  ],
};
