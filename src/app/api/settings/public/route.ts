import { NextRequest, NextResponse } from 'next/server';
import { getPublicSiteSettings } from '@/lib/siteSettings';
import { getClientIp } from '@/lib/ipBan';
import { withApiObservability } from '@/lib/apiHandler';
import { AUTH_RATE_LIMIT, checkRateLimit } from '@/lib/rateLimit';
import { getRedisJson, setRedisJson } from '@/lib/jsonCache';

const CACHE_KEY = 'api:settings:public';
const CACHE_TTL_SECONDS =
  Number.parseInt(process.env.PUBLIC_SETTINGS_CACHE_TTL_SECONDS || '300', 10) || 300;

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
    const cached = await getRedisJson<unknown>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached as object);
    }

    const settings = await getPublicSiteSettings();
    const payload = { success: true, settings };
    await setRedisJson(CACHE_KEY, CACHE_TTL_SECONDS, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('settings/public error:', error);
    const payload = { success: true, settings: { registrationEnabled: true, loginEnabled: true } };
    await setRedisJson(CACHE_KEY, Math.min(CACHE_TTL_SECONDS, 30), payload);
    return NextResponse.json(payload);
  }
});
