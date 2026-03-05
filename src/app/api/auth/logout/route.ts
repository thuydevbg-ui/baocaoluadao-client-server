import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';

function buildRedirectUrl(request: NextRequest): URL {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost || request.headers.get('host') || new URL(request.url).host;
  const proto = forwardedProto || new URL(request.url).protocol.replace(':', '') || 'https';
  return new URL('/admin/login', `${proto}://${host}`);
}

export const POST = withApiObservability(async (request: NextRequest) => {
  // CSRF protection: Validate Origin header for cross-origin requests
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];

  const isProduction = process.env.NODE_ENV === 'production';
  const requestOrigin = new URL(request.url).origin;

  // Allow same-origin by default. If ALLOWED_ORIGINS is set, enforce the list.
  if (origin && allowedOrigins.length > 0) {
    const isAllowedOrigin = allowedOrigins.some((allowed) => {
      // Exact match or proper subdomain match
      const normalizedAllowed = allowed.trim();
      const normalizedOrigin = origin.trim();
      return normalizedOrigin === normalizedAllowed ||
             normalizedOrigin === `https://${normalizedAllowed}` ||
             normalizedOrigin === `http://${normalizedAllowed}`;
    });
    if (!isAllowedOrigin) {
      return NextResponse.json(
        { error: 'Yêu cầu không được phép' },
        { status: 403 }
      );
    }
  }
  // When ALLOWED_ORIGINS is not set, only block explicit cross-origin requests
  if (origin && allowedOrigins.length === 0 && origin !== requestOrigin && isProduction) {
    return NextResponse.json(
      { error: 'Yêu cầu không được phép' },
      { status: 403 }
    );
  }
  
  const response = NextResponse.json({ success: true });

  // Clear the adminAuth cookie
  response.cookies.set('adminAuth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Expire immediately
    path: '/',
  });
  
  return response;
});

// Convenience GET: clear cookie then redirect to /admin/login
export const GET = withApiObservability(async (request: NextRequest) => {
  const response = NextResponse.redirect(buildRedirectUrl(request));
  response.cookies.set('adminAuth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
});
