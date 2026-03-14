import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminAuthValidated } from '@/lib/adminApiAuth';
import { getRedisClientSafe } from '@/lib/redis';
import { RowDataPacket } from 'mysql2/promise';

// Cache configuration
const CACHE_KEY = 'admin:overview';
const CACHE_TTL = 300; // 5 minutes

interface OverviewStats extends RowDataPacket {
  total_reports: number;
  pending_reports: number;
  verified_reports: number;
  rejected_reports: number;
  total_scams: number;
  active_scams: number;
  blocked_scams: number;
}

interface RecentReport extends RowDataPacket {
  id: string;
  type: string;
  target: string;
  status: string;
  created_at: string;
}

interface TypeCount extends RowDataPacket {
  type: string;
  count: number;
}

/**
 * GET /api/admin/overview
 * Get admin dashboard overview from database
 */
export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access',
        },
      },
      { status: 401 }
    );
  }

  try {
    // Try Redis cache first
    const redis = await getRedisClientSafe();
    if (redis) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        console.log('[Admin Overview] Returning cached data');
        const parsed = JSON.parse(cached);
        parsed.source = 'cache';
        return NextResponse.json({
          ...parsed,
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    const db = getDb();

    // Get overview stats
    const [statsResult] = await db.query<OverviewStats[]>(
      `SELECT 
        (SELECT COUNT(*) FROM reports) as total_reports,
        (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
        (SELECT COUNT(*) FROM reports WHERE status = 'verified') as verified_reports,
        (SELECT COUNT(*) FROM reports WHERE status = 'rejected') as rejected_reports,
        (SELECT COUNT(*) FROM scams) as total_scams,
        (SELECT COUNT(*) FROM scams WHERE status = 'active') as active_scams,
        (SELECT COUNT(*) FROM scams WHERE status = 'blocked') as blocked_scams`
    );

    const stats = statsResult[0];

    // Get recent reports
    const [recentReports] = await db.query<RecentReport[]>(
      `SELECT id, type, target, status, created_at 
       FROM reports 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    // Distribution by type
    const [typeCounts] = await db.query<TypeCount[]>(
      `SELECT type, COUNT(*) as count
       FROM reports
       GROUP BY type`
    );

    const responseData = {
      success: true,
      data: {
        reports: {
          total: stats?.total_reports || 0,
          pending: stats?.pending_reports || 0,
          verified: stats?.verified_reports || 0,
          rejected: stats?.rejected_reports || 0,
        },
        scams: {
          total: stats?.total_scams || 0,
          active: stats?.active_scams || 0,
          blocked: stats?.blocked_scams || 0,
        },
        recentReports: recentReports,
        reportTypes: typeCounts,
      },
      source: 'database',
      timestamp: new Date().toISOString(),
    };
    
    // Cache to Redis (after getting response data)
    if (redis) {
      const cacheData = JSON.stringify(responseData);
      await redis.set(CACHE_KEY, cacheData, 'EX', CACHE_TTL).catch(err => {
        console.warn('[Admin Overview] Redis cache error:', err);
      });
      console.log(`[Admin Overview] Cached for ${CACHE_TTL}s`);
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[Admin Overview] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OVERVIEW_ERROR',
          message: 'Failed to fetch overview data',
        },
      },
      { status: 500 }
    );
  }
});
