import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ============================================
// CONSTANTS
// ============================================

const ADMIN_COOKIE = 'adminAuth';
const DEVICE_CHECK_HEADER = 'x-device-check';
const DEVICE_COOKIE = 'device_id';

// ============================================
// HELPERS
// ============================================

function normalizeIp(raw: string | null | undefined): string {
  if (!raw) return '';
  const first = raw.split(',')[0]?.trim() || '';
  const noBrackets = first.replace(/^\[|\]$/g, '');
  const withoutPort = noBrackets.includes(':') && !noBrackets.includes('::')
    ? noBrackets.split(':')[0]
    : noBrackets;
  return withoutPort.toLowerCase();
}

function getClientIp(req: NextRequest): string {
  const candidates = [
    req.headers.get('cf-connecting-ip'),
    req.headers.get('true-client-ip'),
    req.headers.get('x-forwarded-for'),
    req.headers.get('x-client-ip'),
    req.headers.get('x-real-ip'),
    (req as any).ip,
  ];

  for (const raw of candidates) {
    const normalized = normalizeIp(typeof raw === 'string' ? raw : String(raw || ''));
    if (normalized) return normalized;
  }

  return '';
}

function isIpAllowed(req: NextRequest): boolean {
  const allowList = process.env.ADMIN_ALLOWED_IPS?.split(',').map((ip) => ip.trim()).filter(Boolean) || [];
  if (allowList.length === 0) return true;
  const clientIp = getClientIp(req);
  if (!clientIp) return false;
  if (allowList.some((allowed) => allowed.trim() === '*' || allowed.trim().toLowerCase() === 'all')) {
    return true;
  }
  return allowList.some((allowed) => normalizeIp(allowed) === clientIp);
}

function hasAdminCookie(req: NextRequest): boolean {
  const raw = req.cookies.get(ADMIN_COOKIE)?.value;
  return Boolean(raw && raw.length > 10);
}

function addCacheHeaders(response: NextResponse, pathname: string): void {
  // Profile pages should always be dynamic - no cache
  if (pathname.startsWith('/profile') || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return;
  }
  response.headers.set('Cache-Control', 'public, max-age=15, s-maxage=15, stale-while-revalidate=60');
}

function clearAuthCookies(response: NextResponse) {
  const cookieNames = ['next-auth.session-token', 'auth_token', 'auth_refresh_token', DEVICE_COOKIE];
  cookieNames.forEach((name) => {
    response.cookies.set(name, '', { maxAge: 0, path: '/' });
  });
}

// ============================================
// MAIN MIDDLEWARE
// ============================================

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isDeviceCheckRequest = req.headers.get(DEVICE_CHECK_HEADER) === '1';

  console.log('[Middleware] Path:', pathname);

  const response = NextResponse.next();
  addCacheHeaders(response, pathname);

  // ========================================
  // ADMIN ROUTES (existing logic - uses custom cookie)
  // ========================================
  if (pathname.startsWith('/admin')) {
    const isIpCheckRoute = pathname.startsWith('/admin/ip-check');
    const ipAllowed = isIpAllowed(req);
    const authPresent = hasAdminCookie(req);
    const isLoginRoute = pathname.startsWith('/admin/login');

    if (!ipAllowed && !isIpCheckRoute) {
      const url = new URL('/admin/ip-check', req.url);
      return NextResponse.redirect(url);
    }

    if ((!authPresent || !ipAllowed) && !isLoginRoute && !isIpCheckRoute) {
      const url = new URL('/admin/login', req.url);
      return NextResponse.redirect(url);
    }

    if (authPresent && ipAllowed && isLoginRoute) {
      const url = new URL('/admin', req.url);
      return NextResponse.redirect(url);
    }

    return response;
  }

  // ========================================
  // USER PROTECTED ROUTES - Use NextAuth JWT
  // ========================================
  
  const protectedUserRoutes = ['/profile', '/dashboard', '/reports', '/watchlist', '/settings'];
  const isProtectedUserRoute = protectedUserRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  if (isProtectedUserRoute) {
    console.log('[Middleware] Protected route, checking auth for:', pathname);
    
    // Use NextAuth's getToken to verify JWT
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_COOKIE_SECRET,
    });

    console.log('[Middleware] Token:', token ? 'found' : 'not found');

    if (!token) {
      console.log('[Middleware] No token, redirecting to login');
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token.twofaEnabled && !token.twofaVerifiedAt) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('twofa', '1');
      loginUrl.searchParams.set('callbackUrl', `${req.nextUrl.pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    // Add user info to headers for downstream use
    response.headers.set('x-user-id', token.sub || '');
    response.headers.set('x-user-email', token.email || '');
    response.headers.set('x-user-role', token.role as string || 'user');

    if (!isDeviceCheckRequest) {
      const deviceId = req.cookies.get(DEVICE_COOKIE)?.value;
      if (deviceId) {
        try {
          const checkUrl = new URL('/api/user/devices/check', req.url);
          const checkRes = await fetch(checkUrl, {
            method: 'GET',
            headers: {
              cookie: req.headers.get('cookie') || '',
              [DEVICE_CHECK_HEADER]: '1',
            },
            cache: 'no-store',
          });
          if (!checkRes.ok) {
            const loginUrl = new URL('/login', req.url);
            const redirect = NextResponse.redirect(loginUrl);
            clearAuthCookies(redirect);
            return redirect;
          }
        } catch (error) {
          console.error('[Middleware] Device check failed:', error);
        }
      }
    }
  }

  // ========================================
  // API PROTECTED ROUTES
  // ========================================
  
  if (pathname.startsWith('/api/user') || pathname.startsWith('/api/watchlist')) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_COOKIE_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/dashboard/:path*',
    '/reports/:path*',
    '/watchlist/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/api/user/:path*',
    '/api/watchlist/:path*',
  ],
};
