import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/adminApiAuth';
import { getDb } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface SeoRedirectRow extends RowDataPacket {
  id: string;
  from_url: string;
  to_url: string;
  type: '301' | '302' | '307' | '308';
  hits: number;
  is_active: boolean;
  notes: string;
  last_accessed: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * GET /api/admin/seo/redirects
 * List all redirects with pagination
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
  const type = searchParams.get('type') || 'all';
  const activeOnly = searchParams.get('active') === 'true';

  try {
    const db = getDb();
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params: (string | number | boolean)[] = [];

    if (q) {
      whereClause += ' AND (from_url LIKE ? OR to_url LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm);
    }

    if (type !== 'all') {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (activeOnly) {
      whereClause += ' AND is_active = ?';
      params.push(true);
    }

    // Get total count
    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM seo_redirects ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Get redirects
    const [rows] = await db.execute<SeoRedirectRow[]>(
      `SELECT * FROM seo_redirects ${whereClause} ORDER BY hits DESC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    // Get stats
    const [statsRows] = await db.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(hits) as total_hits,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN type = '301' THEN 1 ELSE 0 END) as permanent_count
      FROM seo_redirects`
    );

    return NextResponse.json({
      success: true,
      data: {
        redirects: rows,
        stats: statsRows[0],
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('[Admin SEO Redirects] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch redirects',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/seo/redirects
 * Create or update redirect
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
      from_url,
      to_url,
      type = '301',
      is_active = true,
      notes,
    } = body;

    if (!from_url || !to_url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_URLS',
            message: 'Both from_url and to_url are required',
          },
        },
        { status: 400 }
      );
    }

    const db = getDb();

    if (id) {
      // Update existing
      await db.execute<ResultSetHeader>(
        `UPDATE seo_redirects SET 
          from_url = ?, to_url = ?, type = ?, 
          is_active = ?, notes = ?
        WHERE id = ?`,
        [from_url, to_url, type, is_active, notes || '', id]
      );

      return NextResponse.json({
        success: true,
        data: { id, message: 'Redirect updated successfully' },
      });
    } else {
      // Create new
      const newId = 'RED' + Date.now().toString(36).toUpperCase();
      await db.execute<ResultSetHeader>(
        `INSERT INTO seo_redirects (id, from_url, to_url, type, is_active, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId, from_url, to_url, type, is_active, notes || '']
      );

      return NextResponse.json({
        success: true,
        data: { id: newId, message: 'Redirect created successfully' },
      });
    }
  } catch (error) {
    console.error('[Admin SEO Redirects] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SAVE_ERROR',
          message: 'Failed to save redirect',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/seo/redirects
 * Delete redirect
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
            message: 'Redirect ID is required',
          },
        },
        { status: 400 }
      );
    }

    const db = getDb();
    await db.execute('DELETE FROM seo_redirects WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      data: { message: 'Redirect deleted successfully' },
    });
  } catch (error) {
    console.error('[Admin SEO Redirects] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete redirect',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/admin/seo/redirects
 * Bulk update redirects (e.g., import from CSV)
 */
export const PATCH = withApiObservability(async (request: NextRequest) => {
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
    const { redirects } = body as {
      redirects: Array<{
        from_url: string;
        to_url: string;
        type?: '301' | '302' | '307' | '308';
      }>;
    };

    if (!Array.isArray(redirects) || redirects.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Invalid redirects data',
          },
        },
        { status: 400 }
      );
    }

    const db = getDb();
    let created = 0;
    let updated = 0;

    for (const redirect of redirects) {
      if (!redirect.from_url || !redirect.to_url) continue;

      const type = redirect.type || '301';
      
      // Check if exists
      const [existing] = await db.execute<RowDataPacket[]>(
        'SELECT id FROM seo_redirects WHERE from_url = ?',
        [redirect.from_url]
      );

      if (existing.length > 0) {
        // Update
        await db.execute(
          'UPDATE seo_redirects SET to_url = ?, type = ? WHERE from_url = ?',
          [redirect.to_url, type, redirect.from_url]
        );
        updated++;
      } else {
        // Create
        const newId = 'RED' + Date.now().toString(36).toUpperCase() + created;
        await db.execute(
          'INSERT INTO seo_redirects (id, from_url, to_url, type) VALUES (?, ?, ?, ?)',
          [newId, redirect.from_url, redirect.to_url, type]
        );
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Imported ${created} new redirects, updated ${updated} existing`,
        created,
        updated,
      },
    });
  } catch (error) {
    console.error('[Admin SEO Redirects] PATCH error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: 'Failed to import redirects',
        },
      },
      { status: 500 }
    );
  }
});