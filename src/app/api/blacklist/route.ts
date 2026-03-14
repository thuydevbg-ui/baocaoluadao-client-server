import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getDb } from '@/lib/db';
import { withApiObservability } from '@/lib/apiHandler';
import { getAdminAuthValidated } from '@/lib/adminApiAuth';

const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isMockEnabled = isDevOrTest && process.env.MOCK_DB === '1';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value || `${DEFAULT_LIMIT}`, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value || '1', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

function parseType(value: string | null): string | null {
  if (!value) return null;
  const allowed = ['website', 'phone', 'email', 'bank', 'social', 'sms', 'device', 'system', 'application', 'organization'];
  return allowed.includes(value) ? value : null;
}

// Lightweight mock DB for local smoke tests (set MOCK_DB=1)
const MOCK_SCAMS = [
  {
    id: 'SCM-MOCK1',
    type: 'phone',
    value: '0987654321',
    description: 'Mock scam phone',
    reportCount: 12,
    riskLevel: 'high',
    status: 'blocked',
    source: 'mock',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'SCM-MOCK2',
    type: 'website',
    value: 'phishing.example.com',
    description: 'Mock domain',
    reportCount: 5,
    riskLevel: 'medium',
    status: 'investigating',
    source: 'mock',
    createdAt: new Date().toISOString(),
  },
];

function getDbClient() {
  if (isMockEnabled) {
    return {
      async execute(sql: string, params?: any[]) {
        const lower = sql.toLowerCase();
        const filterType = params && params[0] && typeof params[0] === 'string' && parseType(params[0]) ? params[0] : null;
        const filtered = filterType ? MOCK_SCAMS.filter((r) => r.type === filterType) : MOCK_SCAMS;

        if (lower.includes('count(*)')) {
          return [[{ total: filtered.length }], []];
        }

        if (lower.includes('from scams')) {
          const limit = typeof params?.at(-2) === 'number' ? params!.at(-2) : filtered.length;
          const offset = typeof params?.at(-1) === 'number' ? params!.at(-1) : 0;
          return [filtered.slice(offset, offset + limit), []];
        }

        return [[{ affectedRows: 1 }], []];
      },
    } as any;
  }
  return getDb();
}

function mapRisk(status: string | null, risk: string | null): 'danger' | 'suspected' | 'safe' {
  if ((status || '').toLowerCase() === 'blocked' || (risk || '').toLowerCase() === 'high') return 'danger';
  if ((risk || '').toLowerCase() === 'medium' || (status || '').toLowerCase() === 'investigating') return 'suspected';
  return 'safe';
}

/**
 * GET /api/blacklist
 */
export const GET = withApiObservability(async (request: NextRequest) => {
  const db = getDbClient();
  const { searchParams } = new URL(request.url);
  const page = parsePage(searchParams.get('page'));
  const limit = parseLimit(searchParams.get('limit'));
  const type = parseType(searchParams.get('type'));
  const q = (searchParams.get('q') || '').trim();
  const offset = (page - 1) * limit;

  const filters: string[] = [];
  const params: any[] = [];

  if (type) {
    filters.push('type = ?');
    params.push(type);
  }
  if (q) {
    filters.push('(value LIKE ? OR description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  // Only high-risk or blocked entries are treated as blacklist
  filters.push("(risk_level = 'high' OR status = 'blocked' OR report_count >= 3)");

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM scams ${where}` as string, params);
    const total = (countRows as any[])[0]?.total ?? 0;

    const [rows] = await db.execute(
      `SELECT id, type, value, description, report_count AS reportCount, risk_level AS riskLevel, status, source, created_at AS createdAt
       FROM scams
       ${where}
       ORDER BY report_count DESC, created_at DESC
       LIMIT ? OFFSET ?` as string,
      [...params, limit, offset]
    );

    const items = (rows as any[]).map((row) => ({
      id: row.id,
      target: row.value,
      type: row.type,
      tag: row.status,
      reportCount: row.reportCount ?? 0,
      riskLevel: row.riskLevel,
      status: mapRisk(row.status, row.riskLevel),
      description: row.description,
      source: row.source,
      createdAt: row.createdAt,
    }));

    return NextResponse.json({
      success: true,
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Blacklist] GET error', error);
    return NextResponse.json({ success: false, error: 'Không lấy được danh sách đen' }, { status: 500 });
  }
});

/**
 * POST /api/blacklist
 * Admin-only: insert new blacklist entry
 */
export const POST = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body JSON không hợp lệ' }, { status: 400 });
  }

  const value = typeof body.target === 'string' ? body.target.trim() : '';
  const type = parseType(typeof body.type === 'string' ? body.type : null);
  const description = typeof body.reason === 'string' ? body.reason.trim() : '';
  const risk = typeof body.riskLevel === 'string' ? body.riskLevel.toLowerCase() : 'high';

  if (!value || !type) {
    return NextResponse.json({ success: false, error: 'Thiếu target hoặc type' }, { status: 400 });
  }

  const db = getDbClient();
  try {
    const id = `SCM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date();

    await db.execute(
      `INSERT INTO scams (id, type, value, description, report_count, risk_level, status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'blocked', 'manual', ?, ?)
       ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         report_count = report_count + 1,
         risk_level = VALUES(risk_level),
         status = 'blocked',
         updated_at = VALUES(updated_at)` as string,
      [id, type, value, description || null, 1, risk, now, now]
    );

    return NextResponse.json({ success: true, id, target: value, type });
  } catch (error) {
    console.error('[Blacklist] POST error', error);
    return NextResponse.json({ success: false, error: 'Không thể thêm vào blacklist' }, { status: 500 });
  }
});

export const runtime = 'nodejs';
