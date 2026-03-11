import { NextResponse, type NextRequest } from 'next/server';

// Minimal cookie check in middleware (Edge runtime cannot use crypto)
const ADMIN_COOKIE = 'adminAuth';

function normalizeIp(raw: string | null | undefined): string {
  if (!raw) return '';
  // Take first entry, trim, drop port and brackets
  const first = raw.split(',')[0]?.trim() || '';
  const noBrackets = first.replace(/^\[|\]$/g, '');
  const withoutPort = noBrackets.includes(':') && !noBrackets.includes('::')
    ? noBrackets.split(':')[0]
    : noBrackets;
  return withoutPort.toLowerCase();
}

function getClientIp(req: NextRequest): string {
  // Prefer common CDN/LB headers
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
  if (allowList.length === 0) return true; // no restriction configured
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

/**
 * Add caching headers for public static pages
 */
function addCacheHeaders(response: NextResponse, pathname: string): void {
  // Don't cache admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return;
  }
  
  // Cache static pages at edge for 15 seconds, stale-while-revalidate for 1 minute
  // Reduced from 60s to 15s for scam data freshness
  response.headers.set('Cache-Control', 'public, max-age=15, s-maxage=15, stale-while-revalidate=60');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Add caching for public pages (not admin/api)
  const response = NextResponse.next();
  addCacheHeaders(response, pathname);

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) {
    return response;
  }

  const isIpCheckRoute = pathname.startsWith('/admin/ip-check');
  const ipAllowed = isIpAllowed(req);
  const authPresent = hasAdminCookie(req);
  const isLoginRoute = pathname.startsWith('/admin/login');

  // If IP not allowed -> send to IP check page (but allow that page to render)
  if (!ipAllowed && !isIpCheckRoute) {
    const url = new URL('/admin/ip-check', req.url);
    return NextResponse.redirect(url);
  }

  // If not authenticated and accessing protected admin routes -> redirect to login
  // Allow the IP check page to load even when not authenticated or IP is blocked.
  if ((!authPresent || !ipAllowed) && !isLoginRoute && !isIpCheckRoute) {
    const url = new URL('/admin/login', req.url);
    return NextResponse.redirect(url);
  }

  // If already authenticated and hits login, send to dashboard
  if (authPresent && ipAllowed && isLoginRoute) {
    const url = new URL('/admin', req.url);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run middleware on all routes to enable caching for public pages
  // Admin routes get no-cache, public routes get edge caching
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
