import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/adminApiAuth';
import { getDb } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SeoPageRow extends RowDataPacket {
  url: string;
  updated_at: Date;
  priority: number;
  changefreq: string;
}

/**
 * GET /api/admin/seo/sitemap
 * Get sitemap status and URLs
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

    // Get all indexed pages for sitemap
    const [rows] = await db.execute<SeoPageRow[]>(
      `SELECT url, updated_at, priority, changefreq 
       FROM seo_pages 
       WHERE is_indexed = 1 
       ORDER BY priority DESC, updated_at DESC`
    );

    // Get stats
    const [statsRows] = await db.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_urls,
        MAX(updated_at) as last_generated,
        SUM(CASE WHEN priority = 1.0 THEN 1 ELSE 0 END) as high_priority_count
      FROM seo_pages 
      WHERE is_indexed = 1`
    );

    // Generate XML preview
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://baocaoluadao.com';
    const xmlUrls = rows.map((page) => {
      const lastmod = page.updated_at 
        ? new Date(page.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      return `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq || 'weekly'}</changefreq>
    <priority>${page.priority || 0.5}</priority>
  </url>`;
    });

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls.join('\n')}
</urlset>`;

    return NextResponse.json({
      success: true,
      data: {
        urls: rows,
        stats: {
          totalUrls: statsRows[0]?.total_urls || 0,
          lastGenerated: statsRows[0]?.last_generated,
          highPriorityCount: statsRows[0]?.high_priority_count || 0,
        },
        sitemapXml,
      },
    });
  } catch (error) {
    console.error('[Admin SEO Sitemap] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch sitemap data',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/seo/sitemap
 * Regenerate sitemap
 */
export const POST = withApiObservability(async (request: NextRequest) => {
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

    // Auto-discover and add missing pages
    const defaultPages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/about', priority: 0.8, changefreq: 'weekly' },
      { url: '/report', priority: 0.9, changefreq: 'weekly' },
      { url: '/ai', priority: 0.8, changefreq: 'weekly' },
      { url: '/alerts', priority: 0.7, changefreq: 'daily' },
      { url: '/api-docs', priority: 0.5, changefreq: 'monthly' },
    ];

    let added = 0;
    for (const page of defaultPages) {
      const [existing] = await db.execute<RowDataPacket[]>(
        'SELECT id FROM seo_pages WHERE url = ?',
        [page.url]
      );

      if (existing.length === 0) {
        const newId = 'SEO' + Date.now().toString(36).toUpperCase() + added;
        await db.execute(
          `INSERT INTO seo_pages (id, url, title, priority, changefreq, is_indexed) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [newId, page.url, '', page.priority, page.changefreq, true]
        );
        added++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Sitemap regenerated successfully. Added ${added} new pages.`,
        added,
      },
    });
  } catch (error) {
    console.error('[Admin SEO Sitemap] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REGENERATE_ERROR',
          message: 'Failed to regenerate sitemap',
        },
      },
      { status: 500 }
    );
  }
});