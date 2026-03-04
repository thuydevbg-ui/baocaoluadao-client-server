import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/adminApiAuth';
import { getDb } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface SeoPageRow extends RowDataPacket {
  id: string;
  url: string;
  title: string;
  description: string;
  keywords: string;
  og_image: string;
  og_title: string;
  og_description: string;
  canonical_url: string;
  robots_meta: string;
  priority: number;
  changefreq: string;
  is_indexed: boolean;
  last_crawled: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * GET /api/admin/seo/pages
 * List all SEO pages with pagination and search
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

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10);
  const indexedOnly = searchParams.get('indexed') === 'true';

  try {
    const db = getDb();
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params: (string | number | boolean)[] = [];

    if (q) {
      whereClause += ' AND (url LIKE ? OR title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (indexedOnly) {
      whereClause += ' AND is_indexed = ?';
      params.push(true);
    }

    // Get total count
    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM seo_pages ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Get pages
    const [rows] = await db.execute<SeoPageRow[]>(
      `SELECT * FROM seo_pages ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return NextResponse.json({
      success: true,
      data: {
        pages: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('[Admin SEO Pages] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch SEO pages',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/seo/pages
 * Create or update SEO page metadata
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
    const body = await request.json();
    const {
      id,
      url,
      title,
      description,
      keywords,
      og_image,
      og_title,
      og_description,
      canonical_url,
      robots_meta,
      priority,
      changefreq,
      is_indexed,
    } = body;

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_URL',
            message: 'URL is required',
          },
        },
        { status: 400 }
      );
    }

    const db = getDb();

    if (id) {
      // Update existing
      await db.execute<ResultSetHeader>(
        `UPDATE seo_pages SET 
          url = ?, title = ?, description = ?, keywords = ?, 
          og_image = ?, og_title = ?, og_description = ?, 
          canonical_url = ?, robots_meta = ?, priority = ?, 
          changefreq = ?, is_indexed = ?
        WHERE id = ?`,
        [
          url,
          title || '',
          description || '',
          keywords || '',
          og_image || '',
          og_title || '',
          og_description || '',
          canonical_url || '',
          robots_meta || 'index,follow',
          priority || 0.5,
          changefreq || 'weekly',
          is_indexed !== undefined ? is_indexed : true,
          id,
        ]
      );

      return NextResponse.json({
        success: true,
        data: { id, message: 'SEO page updated successfully' },
      });
    } else {
      // Create new
      const newId = 'SEO' + Date.now().toString(36).toUpperCase();
      await db.execute<ResultSetHeader>(
        `INSERT INTO seo_pages (
          id, url, title, description, keywords, og_image, 
          og_title, og_description, canonical_url, robots_meta, 
          priority, changefreq, is_indexed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          url,
          title || '',
          description || '',
          keywords || '',
          og_image || '',
          og_title || '',
          og_description || '',
          canonical_url || '',
          robots_meta || 'index,follow',
          priority || 0.5,
          changefreq || 'weekly',
          is_indexed !== undefined ? is_indexed : true,
        ]
      );

      return NextResponse.json({
        success: true,
        data: { id: newId, message: 'SEO page created successfully' },
      });
    }
  } catch (error) {
    console.error('[Admin SEO Pages] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SAVE_ERROR',
          message: 'Failed to save SEO page',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/seo/pages
 * Delete SEO page metadata
 */
export const DELETE = withApiObservability(async (request: NextRequest) => {
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ID',
            message: 'Page ID is required',
          },
        },
        { status: 400 }
      );
    }

    const db = getDb();
    await db.execute('DELETE FROM seo_pages WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      data: { message: 'SEO page deleted successfully' },
    });
  } catch (error) {
    console.error('[Admin SEO Pages] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete SEO page',
        },
      },
      { status: 500 }
    );
  }
});