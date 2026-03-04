import { withApiObservability } from '@/lib/apiHandler';
import { NextResponse } from 'next/server';
import { getDashboardStats, getDashboardCategoryBreakdown, checkDashboardHealth } from '@/lib/services/dashboard.service';

// Fallback stats data when database is unavailable
const FALLBACK_STATS = {
  website: 0,
  organization: 0,
  device: 0,
  system: 0,
  application: 0,
  phone: 0,
  email: 0,
  social: 0,
  sms: 0,
  bank: 0,
  total: 0,
  lastUpdated: new Date().toISOString(),
  source: 'fallback',
};

const FALLBACK_CATEGORIES = [
  { name: 'Website lừa đảo', slug: 'website', count: 0, icon: 'globe', description: 'Các website giả mạo, lừa đảo trực tuyến' },
  { name: 'Tổ chức/Doanh nghiệp', slug: 'organization', count: 0, icon: 'building', description: 'Tổ chức, doanh nghiệp lừa đảo' },
  { name: 'Thiết bị điện tử', slug: 'device', count: 0, icon: 'smartphone', description: 'Thiết bị điện tử lừa đảo' },
  { name: 'Hệ thống', slug: 'system', count: 0, icon: 'server', description: 'Hệ thống lừa đảo' },
  { name: 'Ứng dụng', slug: 'application', count: 0, icon: 'app', description: 'Ứng dụng lừa đảo' },
  { name: 'Số điện thoại', slug: 'phone', count: 0, icon: 'phone', description: 'Số điện thoại lừa đảo' },
  { name: 'Email', slug: 'email', count: 0, icon: 'mail', description: 'Email lừa đảo' },
  { name: 'Mạng xã hội', slug: 'social', count: 0, icon: 'facebook', description: 'Tài khoản mạng xã hội lừa đảo' },
  { name: 'SMS', slug: 'sms', count: 0, icon: 'message', description: 'Tin nhắn SMS lừa đảo' },
  { name: 'Ngân hàng', slug: 'bank', count: 0, icon: 'credit-card', description: 'Tài khoản ngân hàng lừa đảo' },
];

/**
 * GET /api/stats
 * Returns dashboard statistics from database
 * Uses Redis caching with 60s TTL
 * Falls back to empty data if database is unavailable
 */
export const GET = withApiObservability(async () => {
  try {
    // Check health first
    const health = await checkDashboardHealth();
    
    if (!health.database) {
      console.warn('[Stats API] Database unavailable, returning fallback data');
      
      return NextResponse.json({
        success: true,
        data: {
          ...FALLBACK_STATS,
          categories: FALLBACK_CATEGORIES,
          summary: {
            website: 0,
            organization: 0,
            device: 0,
            system: 0,
            application: 0,
          },
        },
        total: 0,
        categories: FALLBACK_CATEGORIES,
        source: 'fallback',
        timestamp: new Date().toISOString(),
        warning: 'Dữ liệu tạm thờI không khả dụng do lỗi kết nối cơ sở dữ liệu',
      }, { status: 200 });
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

    // Return fallback data instead of error
    return NextResponse.json({
      success: true,
      data: {
        ...FALLBACK_STATS,
        categories: FALLBACK_CATEGORIES,
        summary: {
          website: 0,
          organization: 0,
          device: 0,
          system: 0,
          application: 0,
        },
      },
      total: 0,
      categories: FALLBACK_CATEGORIES,
      source: 'fallback',
      timestamp: new Date().toISOString(),
      warning: 'Dữ liệu tạm thờI không khả dụng do lỗi hệ thống',
    }, { status: 200 });
  }
});

/**
 * POST /api/stats
 * Force refresh cache
 */
export const POST = withApiObservability(async () => {
  try {
    // Check health first
    const health = await checkDashboardHealth();
    
    if (!health.database) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Không thể kết nối đến cơ sở dữ liệu để làm mới',
        },
      }, { status: 503 });
    }
    
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
