import Redis, { RedisOptions } from 'ioredis';

let redisClient: Redis | null = null;
let initializing: Promise<Redis> | null = null;

const CREATE_OPTIONS: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  reconnectOnError: (err: Error) => {
    console.warn('Redis reconnect due to error:', err.message);
    return true;
  },
  retryStrategy(times: number) {
    return Math.min(1000 * 2 ** times, 1000 * 60);
  },
};

async function createRedisClient(): Promise<Redis> {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is not configured');
  }

  const client = new Redis(url, CREATE_OPTIONS);

  client.on('error', (error) => {
    console.error('Redis connection error:', error.message);
  });

  client.on('connect', () => {
    console.log('Connected to Redis');
  });

  await client.ping();
  return client;
}

export async function getRedisClient(): Promise<Redis> {
  if (redisClient) {
    return redisClient;
  }

  if (initializing) {
    return initializing;
  }

  initializing = createRedisClient();
  try {
    redisClient = await initializing;
    return redisClient;
  } finally {
    initializing = null;
  }
}

export async function getRedisClientSafe(): Promise<Redis | null> {
  try {
    return await getRedisClient();
  } catch (error) {
    console.warn('Redis is unavailable:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function ensureRedisReady(): Promise<boolean> {
  const redis = await getRedisClientSafe();
  if (!redis) return false;

  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}
