import { NextRequest } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { normalizeDomainInput } from '@/lib/dataSources/tinnhiemmang';
import { createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';
import { findPolicyViolationInLocalDb } from '@/lib/services/policyViolation.service';
import { getRedisJson, setRedisJson } from '@/lib/jsonCache';

const CACHE_KEY_PREFIX = 'api:policy-violations:lookup';
const CACHE_TTL_SECONDS =
  Number.parseInt(process.env.POLICY_VIOLATION_LOOKUP_CACHE_TTL_SECONDS || '86400', 10) || 86400;

function isValidDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized || normalized.length > 253) return false;
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(normalized);
}

export const POST = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ success: false, error: 'Forbidden request origin' }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'policy-violations:lookup',
    windowMs: 60_000,
    maxRequests: 60,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ success: false, error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const raw = typeof body?.url === 'string' ? body.url : (typeof body?.domain === 'string' ? body.domain : '');
    if (!raw.trim()) {
      return createSecureJsonResponse({ success: false, error: 'url or domain is required' }, { status: 400 }, rateLimit);
    }

    const domain = normalizeDomainInput(raw);
    if (!domain || !isValidDomain(domain)) {
      return createSecureJsonResponse({ success: false, error: 'Invalid domain format' }, { status: 400 }, rateLimit);
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:${domain}`;
    const cached = await getRedisJson<unknown>(cacheKey);
    if (cached) {
      return createSecureJsonResponse(cached, { status: 200 }, rateLimit);
    }

    const hit = await findPolicyViolationInLocalDb(domain);
    if (!hit) {
      const payload = { success: true, found: false, domain };
      await setRedisJson(cacheKey, CACHE_TTL_SECONDS, payload);
      return createSecureJsonResponse(payload, { status: 200 }, rateLimit);
    }

    const payload = {
      success: true,
      found: true,
      item: hit,
    };
    await setRedisJson(cacheKey, CACHE_TTL_SECONDS, payload);
    return createSecureJsonResponse(payload, { status: 200 }, rateLimit);
  } catch (error) {
    console.error('policy lookup error:', error);
    return createSecureJsonResponse({ success: false, error: 'Lookup failed' }, { status: 500 }, rateLimit);
  }
});

export const GET = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ success: false, error: 'Forbidden request origin' }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'policy-violations:lookup:get',
    windowMs: 60_000,
    maxRequests: 120,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ success: false, error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  return createSecureJsonResponse({
    success: true,
    message: 'Use POST with { url } or { domain } to lookup policy violation flags',
    example: { url: 'https://example.com' },
  }, { status: 200 }, rateLimit);
});
