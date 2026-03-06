import { NextRequest } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { normalizeDomainInput } from '@/lib/dataSources/tinnhiemmang';
import { createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';
import { findPolicyViolationInLocalDb } from '@/lib/services/policyViolation.service';

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

    const hit = await findPolicyViolationInLocalDb(domain);
    if (!hit) {
      return createSecureJsonResponse({ success: true, found: false, domain }, { status: 200 }, rateLimit);
    }

    return createSecureJsonResponse({
      success: true,
      found: true,
      item: hit,
    }, { status: 200 }, rateLimit);
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

