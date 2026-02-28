import os from 'node:os';
import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { getAdminAuth } from '@/lib/adminApiAuth';
import { ensureRedisReady, getRedisClientSafe } from '@/lib/redis';

export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const metrics: Record<string, unknown> = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    loadavg: os.loadavg(),
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  };

  const redisAvailable = await ensureRedisReady();
  if (redisAvailable) {
    const redis = await getRedisClientSafe();
    if (redis) {
      const info = await redis.info('memory');
      const usedLine = info
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith('used_memory_human'));
      const usedValue = usedLine ? usedLine.split(':')[1]?.trim() : 'unknown';
      metrics.redis = usedValue || 'unknown';
    } else {
      metrics.redis = 'unavailable';
    }
  } else {
    metrics.redis = 'unavailable';
  }

  return NextResponse.json({ success: true, metrics });
});
