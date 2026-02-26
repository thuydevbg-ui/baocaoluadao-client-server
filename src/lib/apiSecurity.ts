import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitState {
  key: string;
  limit: number;
  remaining: number;
  resetAt: number;
  ok: boolean;
}

export interface RateLimitOptions {
  keyPrefix: string;
  windowMs: number;
  maxRequests: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __scamGuardApiRateLimitStore: Map<string, RateLimitRecord> | undefined;
}

const rateLimitStore = globalThis.__scamGuardApiRateLimitStore ?? new Map<string, RateLimitRecord>();
if (!globalThis.__scamGuardApiRateLimitStore) {
  globalThis.__scamGuardApiRateLimitStore = rateLimitStore;
}

function cleanupRateLimitStore(now: number): void {
  if (rateLimitStore.size < 5000) return;
  rateLimitStore.forEach((record, key) => {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  });
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  const requestIP = (request as NextRequest & { ip?: string }).ip;

  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP.trim();
  if (cfIP) return cfIP.trim();
  if (requestIP) return requestIP.trim();
  return 'unknown';
}

export function isRequestFromSameOrigin(request: NextRequest): boolean {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== requestUrl.host || originUrl.protocol !== requestUrl.protocol) {
        return false;
      }
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== requestUrl.host || refererUrl.protocol !== requestUrl.protocol) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

export function rateLimitRequest(request: NextRequest, options: RateLimitOptions): RateLimitState {
  const now = Date.now();
  cleanupRateLimitStore(now);

  const ip = getClientIp(request);
  const key = `${options.keyPrefix}:${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    const next: RateLimitRecord = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(key, next);
    return {
      key,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - 1),
      resetAt: next.resetAt,
      ok: true,
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  const remaining = Math.max(0, options.maxRequests - current.count);
  return {
    key,
    limit: options.maxRequests,
    remaining,
    resetAt: current.resetAt,
    ok: current.count <= options.maxRequests,
  };
}

export function applySecurityHeaders(response: NextResponse, rateLimit?: RateLimitState): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (rateLimit) {
    response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.floor(rateLimit.resetAt / 1000)));
  }

  return response;
}

export function createSecureJsonResponse<T>(
  payload: T,
  init?: ResponseInit,
  rateLimit?: RateLimitState
): NextResponse {
  const response = NextResponse.json(payload, init);
  return applySecurityHeaders(response, rateLimit);
}
