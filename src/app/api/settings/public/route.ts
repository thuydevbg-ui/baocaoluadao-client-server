import { NextRequest, NextResponse } from 'next/server';
import { getPublicSiteSettings } from '@/lib/siteSettings';
import { getClientIp } from '@/lib/ipBan';
import { withApiObservability } from '@/lib/apiHandler';
import { AUTH_RATE_LIMIT, checkRateLimit } from '@/lib/rateLimit';

export const GET = withApiObservability(async (request: NextRequest) => {
  const ip = getClientIp(request) ?? 'unknown';
  const rateLimitResult = await checkRateLimit({
    scope: 'public-settings',
    key: ip,
    maxAttempts: 120,
    windowMs: 60 * 1000,
    banSeconds: 5 * 60,
  });

  if (!rateLimitResult.allowed) {
    const response = NextResponse.json(
      { success: false, error: 'Too many requests' },
      {
        status: 429,
        headers: rateLimitResult.retryAfter ? { 'Retry-After': String(rateLimitResult.retryAfter) } : {},
      }
    );
    response.headers.set('X-RateLimit-Limit', String(120));
    response.headers.set('X-RateLimit-Remaining', '0');
    if (rateLimitResult.retryAfter) {
      response.headers.set('X-RateLimit-Reset', String(rateLimitResult.retryAfter));
    }
    return response;
  }

  try {
    const settings = await getPublicSiteSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('settings/public error:', error);
    return NextResponse.json({ success: true, settings: { registrationEnabled: true, loginEnabled: true } });
  }
});
