import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2/promise';
import { checkRateLimit } from '@/lib/rateLimit';
import { getDb } from '@/lib/db';
import { getRedisClientSafe } from '@/lib/redis';
import { d1Query, shouldUseD1Reads } from '@/lib/d1Client';
import {
  getTinnhiemSyncSnapshot,
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

// Cache configuration
const CACHE_TTL_SECONDS = 300; // 5 minutes cache for list endpoints
const CACHE_TTL_STATS_SECONDS = 60; // 1 minute cache for stats (faster changing data)
const CACHE_KEY_PREFIX = 'api:scams';

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

function buildCacheKey(params: {
  page: number;
  limit: number;
  categoryParam: string;
  includeTrusted: boolean;
  getStats: boolean;
}): string {
  return `${CACHE_KEY_PREFIX}:${params.getStats ? 'stats' : `list:${params.categoryParam}:${params.includeTrusted}:p${params.page}:l${params.limit}`}`;
}

/**
 * Try to get cached response from Redis
 */
async function getCachedResponse(params: {
  page: number;
  limit: number;
  categoryParam: string;
  includeTrusted: boolean;
  getStats: boolean;
}): Promise<{ data: unknown; fromCache: boolean } | null> {
  const redis = await getRedisClientSafe();
  if (!redis) return null;

  const cacheKey = buildCacheKey(params);
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('[Cache] Scams data retrieved from Redis');
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(cached);
      } catch (parseError) {
        console.warn('[Cache] Failed to parse cached data, ignoring cache');
        await redis.del(cacheKey);
        return null;
      }
      return { data: parsedData, fromCache: true };
    }
  } catch (error) {
    console.warn('[Cache] Failed to get cached scams:', error);
  }
  return null;
}

/**
 * Cache the response in Redis
 */
async function cacheResponse(
  params: {
    page: number;
    limit: number;
    categoryParam: string;
    includeTrusted: boolean;
    getStats: boolean;
  },
  responseData: unknown
): Promise<void> {
  const redis = await getRedisClientSafe();
  if (!redis) return;

  const cacheKey = buildCacheKey(params);
  // Use shorter TTL for stats (1 min) vs list (5 min)
  const ttl = params.getStats ? CACHE_TTL_STATS_SECONDS : CACHE_TTL_SECONDS;
  try {
    await redis.setex(cacheKey, ttl, JSON.stringify(responseData));
    console.log(`[Cache] Scams data cached for ${ttl}s`);
  } catch (error) {
    console.warn('[Cache] Failed to cache scams:', error);
  }
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

async function fetchFeedbackCountsFromD1(detailKeys: string[]): Promise<Record<string, { ratings: number; comments: number }>> {
  if (detailKeys.length === 0) return {};

  try {
    const placeholders = detailKeys.map(() => '?').join(', ');
    const result: Record<string, { ratings: number; comments: number }> = {};

    try {
      const ratingRows = await d1Query<DbFeedbackCount>(
        `
          SELECT detail_key, COUNT(*) AS ratings
          FROM detail_ratings
          WHERE detail_key IN (${placeholders})
          GROUP BY detail_key
        `,
        detailKeys
      );

      for (const row of ratingRows || []) {
        result[row.detail_key] = { ratings: Number(row.ratings ?? 0), comments: 0 };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || '');
      if (!message.toLowerCase().includes('no such table')) {
        console.warn('[api/scams] D1 detail_ratings unavailable:', error);
      }
    }

    try {
      const commentRows = await d1Query<DbFeedbackCount>(
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
        base.comments = Number(row.comments ?? 0);
        result[row.detail_key] = base;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || '');
      if (!message.toLowerCase().includes('no such table')) {
        console.warn('[api/scams] D1 detail_feedback unavailable:', error);
      }
    }

    return result;
  } catch (error) {
    console.error('[api/scams] Failed to load D1 feedback counters:', error);
    return {};
  }
}

async function fetchViewCountsFromD1(detailKeys: string[]): Promise<Record<string, number>> {
  if (detailKeys.length === 0) return {};

  try {
    const placeholders = detailKeys.map(() => '?').join(', ');
    const rows = await d1Query<DbViewCount>(
      `
        SELECT detail_key, views
        FROM detail_view_counts
        WHERE detail_key IN (${placeholders})
      `,
      detailKeys
    );
    const result: Record<string, number> = {};
    for (const row of rows || []) {
      result[row.detail_key] = Number(row.views ?? 0);
    }
    return result;
  } catch (error) {
    console.error('[api/scams] Failed to load D1 view counters:', error);
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

  // Build cache params
  const cacheParams = { page, limit, categoryParam, includeTrusted, getStats };

  // Check cache first (use shorter TTL for stats)
  const cachedResult = await getCachedResponse(cacheParams);
  if (cachedResult) {
    console.log('[Cache] Returning cached scams data');
    return NextResponse.json(cachedResult.data as object);
  }

  try {
    // Use lighter sync snapshot to avoid triggering background sync
    const syncInfo = await getTinnhiemSyncSnapshot().catch(() => null);
    const useD1 = shouldUseD1Reads();

    if (getStats) {
      const rows = useD1
        ? await d1Query<TypeCountRow>(
            `
              SELECT type, COUNT(*) AS count
              FROM scams
              WHERE source = ? ${includeTrusted ? '' : 'AND is_scam = 1'}
              GROUP BY type
            `,
            [SOURCE_NAME]
          )
        : (await getDb().query<TypeCountRow[]>(
            `
              SELECT type, COUNT(*) AS count
              FROM scams
              WHERE source = ? ${includeTrusted ? '' : 'AND is_scam = 1'}
              GROUP BY type
            `,
            [SOURCE_NAME]
          ))[0];

      const byType = new Map<string, number>();
      for (const row of rows || []) {
        byType.set(row.type, Number(row.count || 0));
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

      const statsResponse = {
        success: true,
        source: SOURCE_NAME,
        data,
        sync: syncInfo,
      };
      // Cache stats with shorter TTL
      await cacheResponse({ ...cacheParams, getStats: true }, statsResponse);
      return NextResponse.json(statsResponse);
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

    const countRows = useD1
      ? await d1Query<CountRow>(
          `SELECT COUNT(*) AS count FROM scams ${whereClause}`,
          params
        )
      : (await getDb().query<CountRow[]>(
          `SELECT COUNT(*) AS count FROM scams ${whereClause}`,
          params
        ))[0];
    const totalItems = Number(countRows[0]?.count || 0);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * limit;

    const rows = useD1
      ? await d1Query<ScamRow>(
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
        )
      : (await getDb().query<ScamRow[]>(
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
        ))[0];

    const detailKeys = Array.from(
      new Set(rows.map((row) => buildDetailKeyFromScam(row.type, row.value)).filter(Boolean))
    );
    const feedbackMap = useD1
      ? await fetchFeedbackCountsFromD1(detailKeys)
      : await fetchFeedbackCounts(detailKeys);
    const viewMap = useD1
      ? await fetchViewCountsFromD1(detailKeys)
      : await fetchViewCounts(detailKeys);

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

    const responseData = {
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
    };

    // Cache the response
    await cacheResponse(cacheParams, responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[api/scams] Database-first flow failed:', error);
    return NextResponse.json(
      { error: 'Failed to load scam data from local database' },
      { status: 500 }
    );
  }
}
