import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getAdminAuth, requireRole } from '@/lib/adminApiAuth';

const querySchema = z.object({
  page: z.string().optional().transform((v) => Number(v ?? 1)).pipe(z.number().int().min(1)),
  pageSize: z.string().optional().transform((v) => Number(v ?? 20)).pipe(z.number().int().min(1).max(100)),
  role: z
    .string()
    .optional()
    .transform((v) => (v === 'all' || v === undefined ? undefined : v))
    .pipe(z.enum(['user', 'admin', 'super_admin', 'moderator']).optional()),
  status: z
    .string()
    .optional()
    .transform((v) => (v === 'all' || v === undefined ? undefined : v))
    .pipe(z.enum(['active', 'banned', 'suspended']).optional()),
  search: z
    .string()
    .optional()
    .transform((v) => v ?? '')
    .transform((v) => v.trim())
    .transform((v) => (v === '' ? undefined : v))
    .pipe(z.string().max(191).optional()),
  q: z
    .string()
    .optional()
    .transform((v) => v ?? '')
    .transform((v) => v.trim())
    .transform((v) => (v === '' ? undefined : v))
    .pipe(z.string().max(191).optional()),
});

export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!requireRole(auth, ['admin', 'super_admin'])) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parseResult.success) {
    return NextResponse.json({ success: false, error: 'Bad request', details: parseResult.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, role, status, search, q } = parseResult.data;
  const offset = (page - 1) * pageSize;
  const searchTerm = search ?? q;

  try {
    const db = getDb();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Check if status column exists; avoid failing on legacy schema
      const [statusColRows] = await conn.query<any[]>(
        "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'status' LIMIT 1"
      );
      const hasStatusColumn = Array.isArray(statusColRows) && statusColRows.length > 0;
      if (status && !hasStatusColumn) {
        await conn.rollback();
        return NextResponse.json(
          { success: false, error: "Status filter is not supported: column 'status' missing" },
          { status: 400 }
        );
      }

      const where: string[] = [];
      const args: any[] = [];

      if (role) {
        where.push('role = ?');
        args.push(role);
      }
      if (status && hasStatusColumn) {
        where.push('status = ?');
        args.push(status);
      }
      if (searchTerm) {
        where.push('email LIKE ?');
        args.push(`%${searchTerm}%`);
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const statusSelect = hasStatusColumn ? 'status' : "'active' AS status";

      const [rows] = await conn.query(
        `SELECT id, email, name, role, ${statusSelect}, created_at, updated_at
         FROM users
         ${whereSql}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...args, pageSize, offset]
      );

      const [countRows] = await conn.query(
        `SELECT COUNT(*) as total FROM users ${whereSql}`,
        args
      );

      await conn.commit();

      const total = (countRows as any)[0]?.total ?? 0;
      return NextResponse.json({
        success: true,
        items: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      });
    } catch (error) {
      await conn.rollback();
      if ((error as any)?.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json({
          success: true,
          items: [],
          pagination: { page, pageSize, total: 0, totalPages: 1 },
        });
      }
      console.error('GET /api/admin/users error:', error);
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('GET /api/admin/users connection error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
});
