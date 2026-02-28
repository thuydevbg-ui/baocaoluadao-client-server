import { getRedisClient } from './redis';

const rateLimitMap = new Map<string, RateLimitRecord>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_MAP_SIZE = 10000;
let cleanupStarted = false;

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  resetTime: number;
}

export interface RateLimitOptions {
  scope: string;
  key?: string | null;
  maxAttempts?: number;
  windowSeconds?: number;
  windowMs?: number;
  banSeconds?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  isBanned?: boolean;
}

export const AUTH_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  banSeconds: 30 * 60,
};

function cleanupRateLimitMap() {
  const now = Date.now();
  const toRemove: string[] = [];

  rateLimitMap.forEach((record, identifier) => {
    if (now > record.resetTime) {
      toRemove.push(identifier);
    }
  });

  if (rateLimitMap.size > MAX_MAP_SIZE) {
    const sorted = Array.from(rateLimitMap.entries()).sort((a, b) => a[1].firstAttempt - b[1].firstAttempt);
    sorted.slice(0, MAX_MAP_SIZE / 2).forEach(([id]) => toRemove.push(id));
  }

  toRemove.forEach((key) => rateLimitMap.delete(key));
}

if (typeof setInterval !== 'undefined' && !cleanupStarted) {
  cleanupStarted = true;
  setInterval(cleanupRateLimitMap, CLEANUP_INTERVAL_MS);
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const maxAttempts = options.maxAttempts ?? AUTH_RATE_LIMIT.maxAttempts;
  const windowSeconds =
    options.windowSeconds ??
    (options.windowMs ? Math.ceil(options.windowMs / 1000) : AUTH_RATE_LIMIT.windowMs / 1000);
  const banSeconds = options.banSeconds ?? AUTH_RATE_LIMIT.banSeconds;
  const compositeKey = `${options.scope}:${options.key || 'unknown'}`;

  const redis = await getRedisClient();
  if (redis) {
    try {
      const count = await redis.incr(`ratelimit:${compositeKey}`);
      if (count === 1) {
        await redis.expire(`ratelimit:${compositeKey}`, windowSeconds);
      }

      if (count > maxAttempts) {
        const ttl = await redis.ttl(`ratelimit:${compositeKey}`);
        return {
          allowed: false,
          isBanned: true,
          retryAfter: ttl > 0 ? ttl : banSeconds,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fail open but fallback to memory limiter
    }
  }

  return checkRateLimitMemory(compositeKey, maxAttempts, windowSeconds, banSeconds);
}

function checkRateLimitMemory(
  key: string,
  maxAttempts: number,
  windowSeconds: number,
  banSeconds: number
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (record && record.resetTime > now && record.count >= maxAttempts) {
    return {
      allowed: false,
      isBanned: true,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  if (!record || now - record.firstAttempt > windowSeconds * 1000) {
    rateLimitMap.set(key, {
      count: 1,
      firstAttempt: now,
      resetTime: now + windowSeconds * 1000,
    });
    return { allowed: true };
  }

  record.count += 1;

  if (record.count >= maxAttempts) {
    record.resetTime = now + banSeconds * 1000;
    return {
      allowed: false,
      isBanned: true,
      retryAfter: banSeconds,
    };
  }

  return { allowed: true };
}
