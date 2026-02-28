import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withApiObservability(async (request: NextRequest) => {
  // CSRF protection: Validate Origin header for cross-origin requests
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
  
  // In production, fail closed - only allow if explicitly configured
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (origin && isProduction && allowedOrigins.length === 0) {
    return NextResponse.json(
      { error: 'CORS not configured. Set ALLOWED_ORIGINS environment variable (comma-separated list of allowed domains)' },
      { status: 403 }
    );
  }
  
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
