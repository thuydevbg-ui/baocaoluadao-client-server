import { withApiObservability } from '@/lib/apiHandler';
import { NextResponse } from 'next/server';
import { getDashboardStats, getDashboardCategoryBreakdown, checkDashboardHealth } from '@/lib/services/dashboard.service';

/**
 * GET /api/stats
 * Returns dashboard statistics from database
 * Uses Redis caching with 60s TTL
 */
export const GET = withApiObservability(async () => {
  try {
    // Check health first
    const health = await checkDashboardHealth();
    
    if (!health.database) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_UNAVAILABLE',
            message: 'Không thể kết nối đến cơ sở dữ liệu',
          },
        },
        { status: 503 }
      );
    }

    // Get dashboard stats (uses cache automatically)
    const stats = await getDashboardStats();
    const breakdown = await getDashboardCategoryBreakdown();

    const payload = {
      ...stats,
      categories: breakdown.categories,
      summary: {
        website: stats.website,
        organization: stats.organization,
        device: stats.device,
        system: stats.system,
        application: stats.application,
      },
    };

    return NextResponse.json({
      success: true,
      data: payload,
      total: payload.total,
      categories: payload.categories,
      source: payload.source,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Stats API] Error fetching stats:', error);

    // Don't leak stack trace in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Lỗi server nội bộ' 
      : error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/stats
 * Force refresh cache
 */
export const POST = withApiObservability(async () => {
  try {
    const stats = await getDashboardStats(true);
    const breakdown = await getDashboardCategoryBreakdown(true);

    const payload = {
      ...stats,
      categories: breakdown.categories,
      summary: {
        website: stats.website,
        organization: stats.organization,
        device: stats.device,
        system: stats.system,
        application: stats.application,
      },
    };

    return NextResponse.json({
      success: true,
      data: payload,
      total: payload.total,
      categories: payload.categories,
      source: payload.source,
      message: 'Cache đã được làm mới',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Stats API] Error refreshing stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REFRESH_ERROR',
          message: error instanceof Error ? error.message : 'Lỗi làm mới dữ liệu',
        },
      },
      { status: 500 }
    );
  }
});
