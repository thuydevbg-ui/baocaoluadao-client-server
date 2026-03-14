import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { withApiObservability } from '@/lib/apiHandler';
import { buildHashedCacheKey, getRedisJson, setRedisJson } from '@/lib/jsonCache';

const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isMockEnabled = isDevOrTest && process.env.MOCK_DB === '1';

const KIND_TO_TYPES: Record<string, string[]> = {
  phone: ['phone'],
  email: ['email'],
  bank: ['bank'],
  domain: ['website'],
  website: ['website'],
  social: ['social'],
  sms: ['sms'],
  all: ['website', 'phone', 'email', 'bank', 'social', 'sms', 'device', 'system', 'application', 'organization'],
};

type LookupStatus = 'safe' | 'suspected' | 'danger';

const CACHE_KEY_PREFIX = 'api:lookup';
const CACHE_TTL_SECONDS = Number.parseInt(process.env.LOOKUP_CACHE_TTL_SECONDS || '120', 10) || 120;

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
];

function getDbClient() {
  if (isMockEnabled) {
    return {
      async execute(sql: string) {
        const isCount = sql.toLowerCase().includes('count(*)');
        if (isCount) {
          return [[{ totalMatches: MOCK_SCAMS.length, totalReports: MOCK_SCAMS.reduce((s, r) => s + (r.reportCount ?? 0), 0) }], []];
        }
        return [MOCK_SCAMS, []];
      },
    } as any;
  }
  return getDb();
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP.trim();
  if (cfIP) return cfIP.trim();
  return 'unknown';
}

function normalizeQuery(input: string | undefined | null): string {
  if (!input) return '';
  return input.trim().slice(0, 500);
}

function normalizeKind(kind: string | undefined | null): string {
  const key = (kind || 'all').toLowerCase();
  return KIND_TO_TYPES[key] ? key : 'all';
}

function mapRiskToStatus(risk: string | null, status: string | null): LookupStatus {
  const riskLevel = (risk || '').toLowerCase();
  const currentStatus = (status || '').toLowerCase();
  if (currentStatus === 'blocked' || riskLevel === 'high') return 'danger';
  if (riskLevel === 'medium' || currentStatus === 'investigating') return 'suspected';
  return 'safe';
}

export const POST = withApiObservability(async (request: NextRequest) => {
  const db = getDbClient();
  const ip = getClientIP(request);

  const rate = await checkRateLimit({
    scope: 'lookup',
    key: ip,
    maxAttempts: 20,
    windowSeconds: 60,
    banSeconds: 5 * 60,
  });

  if (!rate.allowed) {
    const response = NextResponse.json(
      { success: false, error: 'Quá nhiều yêu cầu, vui lòng thử lại.' },
      {
        status: 429,
        headers: rate.retryAfter ? { 'Retry-After': String(rate.retryAfter) } : {},
      }
    );
    return response;
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body JSON không hợp lệ' }, { status: 400 });
  }

  const query = normalizeQuery(typeof body.query === 'string' ? body.query : '');
  const kind = normalizeKind(typeof body.kind === 'string' ? body.kind : 'all');

  if (query.length < 3) {
    return NextResponse.json({ success: false, error: 'Từ khóa tối thiểu 3 ký tự' }, { status: 400 });
  }

  const cacheKey = buildHashedCacheKey(CACHE_KEY_PREFIX, { kind, query });
  const cached = await getRedisJson<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached as object);
  }

  const types = KIND_TO_TYPES[kind];

  try {
    // Find exact/like matches in scams table
    const placeholders = types.map(() => '?').join(',');
    const [scamRows] = await db.execute(
      `SELECT id, type, value, description, report_count AS reportCount, risk_level AS riskLevel, status, source, created_at AS createdAt
       FROM scams
       WHERE type IN (${placeholders}) AND (value = ? OR value LIKE ?)
       ORDER BY report_count DESC, created_at DESC
       LIMIT 25`,
      [...types, query, `%${query}%`]
    );

    // Aggregate report count from scams table (fallback)
    const [reportAgg] = await db.execute(
      `SELECT COUNT(*) AS totalMatches, SUM(report_count) AS totalReports
       FROM scams
       WHERE type IN (${placeholders}) AND value LIKE ?`,
      [...types, `%${query}%`]
    );

    const matches = (scamRows as any[]).map((row) => ({
      id: row.id,
      target: row.value,
      type: row.type,
      description: row.description,
      reportCount: row.reportCount ?? 0,
      riskLevel: row.riskLevel,
      status: row.status,
      source: row.source,
      createdAt: row.createdAt,
    }));

    const aggregated = (reportAgg as any[])[0] || { totalMatches: 0, totalReports: 0 };

    // Determine overall status
    let overall: LookupStatus = 'safe';
    for (const item of matches) {
      const status = mapRiskToStatus(item.riskLevel, item.status);
      if (status === 'danger') {
        overall = 'danger';
        break;
      }
      if (status === 'suspected') {
        overall = 'suspected';
      }
    }

    const payload = {
      success: true,
      query,
      kind,
      status: overall,
      matches,
      summary: {
        totalMatches: aggregated.totalMatches || matches.length,
        totalReports: aggregated.totalReports || 0,
      },
    };

    await setRedisJson(cacheKey, CACHE_TTL_SECONDS, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Lookup error:', error);
    return NextResponse.json({ success: false, error: 'Không tra cứu được. Thử lại sau.' }, { status: 500 });
  }
});

export const runtime = 'nodejs';
