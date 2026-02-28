import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';

interface HealthCheckPayload {
  database: boolean;
  redis: boolean;
  environment: boolean;
  timestamp: string;
}

export async function GET() {
  let dbStatus = false;
  let redisStatus = false;
  const envReady =
    Boolean(process.env.NODE_ENV === 'production') &&
    Boolean(process.env.AUTH_COOKIE_SECRET) &&
    Boolean(process.env.ADMIN_EMAIL) &&
    Boolean(process.env.ADMIN_PASSWORD_HASH) &&
    Boolean(process.env.DB_HOST) &&
    Boolean(process.env.DB_USER) &&
    Boolean(process.env.DB_NAME);

  try {
    const db = getDb();
    await db.query('SELECT 1');
    dbStatus = true;
  } catch (error) {
    console.error('Health check DB error:', error);
  }

  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.ping();
      redisStatus = true;
    }
  } catch (error) {
    console.error('Health check Redis error:', error);
  }

  const payload: HealthCheckPayload = {
    database: dbStatus,
    redis: redisStatus,
    environment: envReady,
    timestamp: new Date().toISOString(),
  };

  const statusCode = dbStatus && envReady ? 200 : 503;
  return NextResponse.json({ status: dbStatus && envReady ? 'ok' : 'degraded', checks: payload }, { status: statusCode });
}
