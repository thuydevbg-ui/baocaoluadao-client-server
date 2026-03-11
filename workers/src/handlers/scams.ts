/**
 * Scams list handler
 * GET /api/scams
 */

import { createJsonResponse, getCacheHeaders, parseQueryParams } from '../utils';
import type { Env } from '../types';
import type { ScamType } from '../types';

// Fallback data when database is unavailable
const FALLBACK_SCAMS: ScamType[] = [];
const SOURCE_NAME = 'tinnhiemmang.vn';

type ScamRow = {
  id: string;
  type: ScamType['type'];
  value: string;
  description: string | null;
  reportCount: number | string | null;
  status: string | null;
  riskLevel: 'low' | 'medium' | 'high' | null;
  externalStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapScamStatus(externalStatus: string | null, internalStatus: string | null): string {
  if (externalStatus && externalStatus.trim()) return externalStatus.trim();
  if (internalStatus === 'blocked') return 'confirmed';
  if (internalStatus === 'investigating') return 'suspected';
  return internalStatus || 'active';
}

function normalizeType(value: string | undefined | null): ScamType['type'] | null {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'web' || normalized === 'website' || normalized === 'websites') return 'website';
  if (normalized === 'org' || normalized === 'organization' || normalized === 'organizations') return 'organization';
  if (normalized === 'app' || normalized === 'application' || normalized === 'apps') return 'application';
  if (normalized === 'device' || normalized === 'devices') return 'device';
  if (normalized === 'system' || normalized === 'systems') return 'system';
  if (normalized === 'phone' || normalized === 'phones') return 'phone';
  if (normalized === 'email' || normalized === 'emails') return 'email';
  if (normalized === 'bank' || normalized === 'banks') return 'bank';
  if (normalized === 'social') return 'social';
  if (normalized === 'sms') return 'sms';
  return null;
}

export async function handleScams(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const url = new URL(request.url);
  const params = parseQueryParams(url);

  const page = parseInt(params.page || '1', 10);
  const limit = Math.min(parseInt(params.limit || '20', 10), 100);
  const type = normalizeType(params.type);
  const search = (params.search || '').trim();
  const includeTrusted = params.includeTrusted === 'true';

  // Try to get from cache first
  const cacheKey = `scams:${page}:${limit}:${type || 'all'}:${search || ''}:${includeTrusted ? 'all' : 'scam'}`;
  
  if (env.CACHE) {
    try {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return createJsonResponse(JSON.parse(cached), 200, origin, {
          ...corsHeaders,
          ...getCacheHeaders(300), // 5 min cache
          'X-Cache': 'HIT',
        });
      }
    } catch (e) {
      // Cache error, continue to database
    }
  }

  // Query D1 when available
  let scams: ScamType[] = FALLBACK_SCAMS;
  let total = FALLBACK_SCAMS.length;

  if (env.DB) {
    try {
      const where: string[] = ['source = ?'];
      const bindings: Array<string | number> = [SOURCE_NAME];

      if (type) {
        where.push('type = ?');
        bindings.push(type);
      }

      if (!includeTrusted) {
        where.push('is_scam = 1');
      }

      if (search) {
        where.push('(value LIKE ? OR description LIKE ?)');
        bindings.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = `WHERE ${where.join(' AND ')}`;

      const countStmt = env.DB.prepare(`SELECT COUNT(*) AS count FROM scams ${whereClause}`);
      const countRow = await countStmt.bind(...bindings).first<{ count: number }>();
      total = countRow?.count || 0;

      const offset = Math.max(0, (page - 1) * limit);
      const dataStmt = env.DB.prepare(
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
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM scams
          ${whereClause}
          ORDER BY COALESCE(external_created_at, created_at) DESC, updated_at DESC
          LIMIT ? OFFSET ?
        `
      );
      const dataResult = await dataStmt.bind(...bindings, limit, offset).all<ScamRow>();

      if (dataResult.success && dataResult.results) {
        scams = dataResult.results.map((row) => ({
          id: row.id,
          type: row.type,
          value: row.value,
          description: row.description || '',
          reportCount: Number(row.reportCount || 0),
          status: mapScamStatus(row.externalStatus, row.status),
          riskLevel: (row.riskLevel as ScamType['riskLevel']) || 'medium',
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
      }
    } catch (error) {
      console.error('D1 query error:', error);
      scams = FALLBACK_SCAMS;
      total = scams.length;
    }
  }

  const paginatedScams = scams;

  const response = {
    success: true,
    data: paginatedScams,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    lastUpdated: new Date().toISOString(),
  };

  // Cache the response
  if (env.CACHE) {
    ctx.waitUntil(env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 }));
  }

  return createJsonResponse(response, 200, origin, {
    ...corsHeaders,
    ...getCacheHeaders(300),
  });
}
