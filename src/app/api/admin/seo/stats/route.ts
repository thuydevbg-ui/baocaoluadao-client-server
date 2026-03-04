import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/adminApiAuth';
import { getDb } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/admin/seo/stats
 * Get SEO statistics
 */
export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
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
    const db = getDb();

    // Pages stats
    const [pagesStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_pages,
        SUM(CASE WHEN is_indexed = 1 THEN 1 ELSE 0 END) as indexed_pages,
        SUM(CASE WHEN is_indexed = 0 THEN 1 ELSE 0 END) as noindexed_pages,
        SUM(CASE WHEN title = '' OR title IS NULL THEN 1 ELSE 0 END) as missing_title,
        SUM(CASE WHEN description = '' OR description IS NULL THEN 1 ELSE 0 END) as missing_description
      FROM seo_pages`
    );

    // Redirects stats
    const [redirectsStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_redirects,
        SUM(hits) as total_hits,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_redirects
      FROM seo_redirects`
    );

    // Health stats
    const [healthStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_issues,
        SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as errors,
        SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warnings
      FROM seo_health_checks
      WHERE resolved_at IS NULL`
    );

    // Calculate SEO Score (0-100)
    const totalPages = pagesStats[0]?.total_pages || 0;
    const indexedPages = pagesStats[0]?.indexed_pages || 0;
    const missingTitles = pagesStats[0]?.missing_title || 0;
    const missingDescriptions = pagesStats[0]?.missing_description || 0;
    const errors = healthStats[0]?.errors || 0;
    const warnings = healthStats[0]?.warnings || 0;

    let seoScore = 100;
    if (totalPages > 0) {
      // Deduct for missing titles (max -20)
      seoScore -= Math.min(20, (missingTitles / totalPages) * 100);
      // Deduct for missing descriptions (max -15)
      seoScore -= Math.min(15, (missingDescriptions / totalPages) * 100);
      // Deduct for errors (max -30)
      seoScore -= Math.min(30, errors * 5);
      // Deduct for warnings (max -15)
      seoScore -= Math.min(15, warnings * 2);
    }
    seoScore = Math.max(0, Math.round(seoScore));

    // Mock Core Web Vitals (in real app, these would come from CrUX API or Lighthouse)
    const coreWebVitals = {
      lcp: { value: 2.4, unit: 's', status: 'needs_improvement' }, // Largest Contentful Paint
      cls: { value: 0.05, unit: '', status: 'good' }, // Cumulative Layout Shift
      fid: { value: 18, unit: 'ms', status: 'good' }, // First Input Delay
    };

    // Mock traffic data (last 30 days)
    const trafficData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        organic: Math.floor(Math.random() * 500) + 200,
        direct: Math.floor(Math.random() * 300) + 100,
      };
    });

    // Mock top keywords
    const topKeywords = [
      { keyword: 'báo cáo lừa đảo', position: 3, volume: 1200 },
      { keyword: 'kiểm tra website lừa đảo', position: 5, volume: 800 },
      { keyword: 'số điện thoại lừa đảo', position: 2, volume: 2500 },
      { keyword: 'email lừa đảo', position: 4, volume: 600 },
      { keyword: 'cách nhận biết lừa đảo', position: 8, volume: 400 },
    ];

    // Recent alerts
    const [recentAlerts] = await db.execute<RowDataPacket[]>(
      `SELECT check_type, details, severity, created_at
       FROM seo_health_checks
       WHERE resolved_at IS NULL
       ORDER BY created_at DESC
       LIMIT 5`
    );

    return NextResponse.json({
      success: true,
      data: {
        seoScore,
        pages: {
          total: totalPages,
          indexed: indexedPages,
          noindexed: pagesStats[0]?.noindexed_pages || 0,
          missingTitle: missingTitles,
          missingDescription: missingDescriptions,
        },
        redirects: {
          total: redirectsStats[0]?.total_redirects || 0,
          active: redirectsStats[0]?.active_redirects || 0,
          totalHits: redirectsStats[0]?.total_hits || 0,
        },
        health: {
          totalIssues: healthStats[0]?.total_issues || 0,
          errors: errors,
          warnings: warnings,
        },
        coreWebVitals,
        traffic: trafficData,
        topKeywords,
        recentAlerts: recentAlerts.map((alert) => ({
          type: alert.check_type,
          message: alert.details,
          severity: alert.severity,
          date: alert.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[Admin SEO Stats] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch SEO stats',
        },
      },
      { status: 500 }
    );
  }
});