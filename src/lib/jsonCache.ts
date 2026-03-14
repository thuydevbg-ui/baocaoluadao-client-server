import { createHash } from 'node:crypto';
import { getRedisClientSafe } from './redis';

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function buildHashedCacheKey(prefix: string, payload: unknown): string {
  const hash = createHash('sha1').update(JSON.stringify(payload)).digest('hex');
  return `${prefix}:${hash}`;
}

export async function getRedisJson<T>(key: string): Promise<T | null> {
  const redis = await getRedisClientSafe();
  if (!redis) return null;

  try {
    const cached = await redis.get(key);
    if (!cached) return null;
    return safeJsonParse<T>(cached);
  } catch {
    return null;
  }
}

export async function setRedisJson(key: string, ttlSeconds: number, value: unknown): Promise<void> {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) return;

  const redis = await getRedisClientSafe();
  if (!redis) return;

  try {
    await redis.setex(key, Math.floor(ttlSeconds), JSON.stringify(value));
  } catch {
    // Ignore cache write failures.
  }
}

