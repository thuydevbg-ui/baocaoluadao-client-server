import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2/promise';
import { checkRateLimit } from '@/lib/rateLimit';
import { getDb } from '@/lib/db';
import {
  ensureTinnhiemScamsSynced,
  getCategoryNameByType,
  getCategorySlugByType,
  mapCategoryParamToScamType,
  mapScamTypeToLegacyType,
  buildDetailKeyFromScam,
} from '@/lib/services/tinnhiemSync.service';

type ScamType =
  | 'website'
  | 'phone'
  | 'email'
  | 'bank'
  | 'social'
  | 'sms'
  | 'device'
  | 'system'
  | 'application'
  | 'organization';

interface CountRow extends RowDataPacket {
  count: number;
}

interface ScamRow extends RowDataPacket {
  id: string;
  type: ScamType;
  value: string;
  description: string;
  reportCount: number;
  status: string;
  riskLevel: 'low' | 'medium' | 'high';
  externalStatus: string | null;
  organizationName: string | null;
  organizationIcon: string | null;
  sourceUrl: string | null;
  externalCreatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  icon: string | null;
  isScam: number;
}

interface TypeCountRow extends RowDataPacket {
  type: ScamType;
  count: number;
}

interface DbFeedbackCount extends RowDataPacket {
  detail_key: string;
  ratings?: number;
  comments?: number;
}

interface DbViewCount extends RowDataPacket {
  detail_key: string;
  views?: number;
}

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 100;
const SOURCE_NAME = 'tinnhiemmang.vn';

function parsePositiveInt(input: string | null, fallback: number, max: number): number {
  const value = Number.parseInt(String(input || fallback), 10);
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(value, max);
}

function parsePage(input: string | null): number {
  const page = Number.parseInt(String(input || '1'), 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return page;
}

function mapScamStatus(externalStatus: string | null, internalStatus: string): string {
  if (externalStatus && externalStatus.trim()) return externalStatus.trim();
  if (internalStatus === 'blocked') return 'confirmed';
  if (internalStatus === 'investigating') return 'suspected';
  return 'active';
}

function formatDate(dateValue: string | null): string {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) return 'N/A';

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function fetchFeedbackCounts(detailKeys: string[]): Promise<Record<string, { ratings: number; comments: number }>> {
  if (detailKeys.length === 0) return {};

  try {
    const db = getDb();
    const placeholders = detailKeys.map(() => '?').join(', ');
    const result: Record<string, { ratings: number; comments: number }> = {};

    const [ratingRows] = await db.query<DbFeedbackCount[]>(
      `
        SELECT detail_key, COUNT(*) AS ratings
        FROM detail_ratings
        WHERE detail_key IN (${placeholders})
        GROUP BY detail_key
      `,
      detailKeys
    );

    for (const row of ratingRows || []) {
      result[row.detail_key] = { ratings: row.ratings ?? 0, comments: 0 };
    }

    const [commentRows] = await db.query<DbFeedbackCount[]>(
      `
        SELECT detail_key, COUNT(*) AS comments
        FROM detail_feedback
        WHERE detail_key IN (${placeholders})
        GROUP BY detail_key
      `,
      detailKeys
    );

    for (const row of commentRows || []) {
      const base = result[row.detail_key] || { ratings: 0, comments: 0 };
      base.comments = row.comments ?? 0;
      result[row.detail_key] = base;
    }

    return result;
  } catch (error) {
    console.error('[api/scams] Failed to load feedback counters:', error);
    return {};
  }
}

async function fetchViewCounts(detailKeys: string[]): Promise<Record<string, number>> {
  if (detailKeys.length === 0) return {};

  try {
    const db = getDb();
    const placeholders = detailKeys.map(() => '?').join(', ');
    const [rows] = await db.query<DbViewCount[]>(
      `
        SELECT detail_key, views
        FROM detail_view_counts
        WHERE detail_key IN (${placeholders})
      `,
      detailKeys
    );

    const result: Record<string, number> = {};
    for (const row of rows || []) {
      const views = typeof row.views === 'number' ? row.views : Number.parseInt(String(row.views ?? 0), 10);
      result[row.detail_key] = Number.isFinite(views) ? Math.max(0, Math.floor(views)) : 0;
    }
    return result;
  } catch (error) {
    // Table may not exist yet (migration not applied) or DB may be unavailable.
    console.error('[api/scams] Failed to load view counters:', error);
    return {};
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientIP =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateLimit = await checkRateLimit({
    scope: 'api:scams',
    key: clientIP,
    maxAttempts: 10,
    windowSeconds: 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parsePage(searchParams.get('page'));
  const limit = parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);
  const getStats = searchParams.get('stats') === 'true';
  const categoryParam = searchParams.get('category') || 'all';
  const categoryType = mapCategoryParamToScamType(categoryParam);
  const includeTrusted = searchParams.get('includeTrusted') === 'true';

  try {
    const syncInfo = await ensureTinnhiemScamsSynced();
    const db = getDb();

    if (getStats) {
      const [rows] = await db.query<TypeCountRow[]>(
        `
          SELECT type, COUNT(*) AS count
          FROM scams
          WHERE source = ? ${includeTrusted ? '' : 'AND is_scam = 1'}
          GROUP BY type
        `,
        [SOURCE_NAME]
      );

      const byType = new Map<string, number>();
      for (const row of rows || []) {
        byType.set(row.type, row.count || 0);
      }

      const orderedTypes: ScamType[] = [
        'website',
        'organization',
        'phone',
        'bank',
        'email',
        'social',
        'application',
        'device',
        'sms',
        'system',
      ];

      const data = orderedTypes.map((type) => ({
        name: getCategoryNameByType(type),
        slug: getCategorySlugByType(type),
        count: byType.get(type) || 0,
        icon: '🛡️',
      }));

      return NextResponse.json({
        success: true,
        source: SOURCE_NAME,
        data,
        sync: syncInfo,
      });
    }

    const where: string[] = ['source = ?'];
    const params: Array<string | number> = [SOURCE_NAME];

    if (categoryType) {
      where.push('type = ?');
      params.push(categoryType);
    }

    if (!includeTrusted) {
      where.push('is_scam = 1');
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    const [countRows] = await db.query<CountRow[]>(
      `SELECT COUNT(*) AS count FROM scams ${whereClause}`,
      params
    );
    const totalItems = countRows[0]?.count || 0;

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * limit;

    const [rows] = await db.query<ScamRow[]>(
      `
        SELECT
          id,
          type,
          value,
          description,
          report_count AS reportCount,
          status,
          risk_level AS riskLevel,
          external_status AS externalStatus,
          organization_name AS organizationName,
          organization_icon AS organizationIcon,
          source_url AS sourceUrl,
          external_created_at AS externalCreatedAt,
          created_at AS createdAt,
          updated_at AS updatedAt,
          icon,
          is_scam AS isScam
        FROM scams
        ${whereClause}
        ORDER BY COALESCE(external_created_at, created_at) DESC, updated_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const detailKeys = Array.from(
      new Set(rows.map((row) => buildDetailKeyFromScam(row.type, row.value)).filter(Boolean))
    );
    const feedbackMap = await fetchFeedbackCounts(detailKeys);
    const viewMap = await fetchViewCounts(detailKeys);

    const data = rows.map((row, index) => {
      const detailKey = buildDetailKeyFromScam(row.type, row.value);
      const feedback = feedbackMap[detailKey] || { ratings: 0, comments: 0 };
      const views = viewMap[detailKey] ?? 0;

      return {
        id: offset + index + 1,
        externalId: row.id,
        name: row.value,
        domain: row.value,
        type: mapScamTypeToLegacyType(row.type),
        reports: Number(row.reportCount || 0),
        ratings: feedback.ratings,
        comments: feedback.comments,
        views,
        status: mapScamStatus(row.externalStatus, row.status),
        date: formatDate(row.externalCreatedAt || row.createdAt),
        description: row.description || '',
        organization: row.organizationName || '',
        source_url: row.sourceUrl || '',
        updated_at: row.updatedAt,
        icon: row.organizationIcon || row.icon || '',
        is_scam: row.isScam === 1,
      };
    });

    return NextResponse.json({
      success: true,
      source: SOURCE_NAME,
      data,
      pagination: {
        page: safePage,
        limit,
        totalPages,
        totalItems,
      },
      sync: syncInfo,
    });
  } catch (error) {
    console.error('[api/scams] Database-first flow failed:', error);
    return NextResponse.json(
      { error: 'Failed to load scam data from local database' },
      { status: 500 }
    );
  }
}
