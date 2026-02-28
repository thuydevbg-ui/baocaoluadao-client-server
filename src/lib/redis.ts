let redisClient: any = null;

export async function getRedisClient() {
  if (redisClient) return redisClient;

  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) return null;

  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: REDIS_URL,
      token: process.env.REDIS_TOKEN || '',
    });
    return redisClient;
  } catch (error) {
    console.warn('Redis not available, falling back to in-memory rate limiting');
    return null;
  }
}

export function resetRedisClientForTesting() {
  if (!redisClient) return;
  if (typeof redisClient.disconnect === 'function') {
    redisClient.disconnect();
  }
  redisClient = null;
}
