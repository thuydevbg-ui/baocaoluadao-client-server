import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest } from 'next/server';
import { createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';
import { getDb } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// Valid scam types in database
const VALID_SCAM_TYPES = ['website', 'phone', 'email', 'bank', 'social', 'sms', 'organization'] as const;
type ScamType = typeof VALID_SCAM_TYPES[number];
const SOURCE_NAME = 'tinnhiemmang.vn';

// Mapping từ category slug (từ URL params) sang scam type trong database
const CATEGORY_SLUG_MAP: Record<string, ScamType> = {
  website: 'website',
  websites: 'website',
  phone: 'phone',
  device: 'phone',      // Map device -> phone
  devices: 'phone',
  email: 'email',
  bank: 'bank',
  organization: 'organization',
  organizations: 'organization',
  social: 'social',
  sms: 'sms',
  app: 'website',       // Map app -> website (app listings)
  apps: 'website',
  system: 'website',    // Map system -> website
  systems: 'website',
};

function parseCategory(value: unknown): ScamType {
  const category = typeof value === 'string' ? value.toLowerCase().trim() : '';
  
  // Check direct mapping first
  if (CATEGORY_SLUG_MAP[category]) {
    return CATEGORY_SLUG_MAP[category];
  }
  
  // Check if it's a valid scam type directly
  if (VALID_SCAM_TYPES.includes(category as ScamType)) {
    return category as ScamType;
  }
  
  // Default fallback
  return 'website';
}

function parsePage(value: unknown): number {
  const page = typeof value === 'number' ? value : Number.parseInt(String(value ?? '1'), 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function parseQuery(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 120);
}

export const POST = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ success: false, error: 'Forbidden request origin', items: [] }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'categories:post',
    windowMs: 60_000,
    maxRequests: 40,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ success: false, error: 'Too many requests', items: [] }, { status: 429 }, rateLimit);
  }

  try {
    const payload = await request.json();
    const category = parseCategory(payload?.category);
    const page = parsePage(payload?.page);
    const query = parseQuery(payload?.query);
    const perPage = Math.min(Math.max(Number(payload?.perPage) || 30, 1), 200);

    const db = getDb();
    const offset = (page - 1) * perPage;

    // Build query conditions
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    conditions.push('source = ?');
    params.push(SOURCE_NAME);

    conditions.push('type = ?');
    params.push(category);

    if (query) {
      conditions.push('(value LIKE ? OR description LIKE ?)');
      params.push(`%${query}%`, `%${query}%`);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    interface CountRow extends RowDataPacket {
      count: number;
    }
    const [countRows] = await db.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM scams WHERE ${whereClause}`,
      params
    );
    let total = countRows[0]?.count || 0;

    // Get items for current page
    interface ScamRow extends RowDataPacket {
      id: string;
      type: string;
      name: string;
      description: string;
      count_report: number;
      status: string;
      source_status: string;
      source: string;
      created_at: Date;
      icon: string | null;
      organization_name: string | null;
      organization_icon: string | null;
      is_scam: boolean;
    }

    let rows: ScamRow[] = [];

    if (total > 0) {
      const [fetchedRows] = await db.query<ScamRow[]>(
        `SELECT 
          id,
          type,
          value as name,
          description,
          report_count as count_report,
          risk_level as status,
          status as source_status,
          source,
          created_at,
          icon,
          organization_name,
          organization_icon,
          is_scam
        FROM scams 
        WHERE ${whereClause}
        ORDER BY report_count DESC, created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, perPage, offset]
      );
      rows = fetchedRows;
    }

    // Fallback for organization category while org feed is being backfilled:
    // derive organizations from trusted website records.
    if (category === 'organization' && total === 0) {
      const orgWhere = ['source = ?', "type = 'website'", 'is_scam = 0', "organization_name IS NOT NULL", "TRIM(organization_name) <> ''"];
      const orgParams: (string | number)[] = [SOURCE_NAME];

      if (query) {
        orgWhere.push('organization_name LIKE ?');
        orgParams.push(`%${query}%`);
      }

      const orgWhereClause = orgWhere.join(' AND ');
      const [orgCountRows] = await db.query<CountRow[]>(
        `SELECT COUNT(DISTINCT LOWER(TRIM(organization_name))) AS count FROM scams WHERE ${orgWhereClause}`,
        orgParams
      );
      total = orgCountRows[0]?.count || 0;

      if (total > 0) {
        const [orgRows] = await db.query<ScamRow[]>(
          `
            SELECT
              CONCAT('ORG-', UPPER(SUBSTRING(SHA1(LOWER(TRIM(organization_name))), 1, 18))) AS id,
              'organization' AS type,
              TRIM(organization_name) AS name,
              CONCAT('Đối tượng tín nhiệm có ', COUNT(*), ' website đã kiểm duyệt') AS description,
              SUM(report_count) AS count_report,
              'low' AS status,
              'trusted' AS source_status,
              source,
              MAX(COALESCE(external_created_at, created_at)) AS created_at,
              MAX(NULLIF(organization_icon, '')) AS icon,
              TRIM(organization_name) AS organization_name,
              MAX(NULLIF(organization_icon, '')) AS organization_icon,
              0 AS is_scam
            FROM scams
            WHERE ${orgWhereClause}
            GROUP BY LOWER(TRIM(organization_name))
            ORDER BY MAX(COALESCE(external_created_at, created_at)) DESC
            LIMIT ? OFFSET ?
          `,
          [...orgParams, perPage, offset]
        );
        rows = orgRows;
      }
    }

    // Map database rows to API response format
    const items = (rows || []).map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description || '',
      count_report: String(row.count_report || 0),
      status: row.status === 'high' ? 'scam' : 
              row.status === 'medium' ? 'suspected' : 
              row.is_scam === false ? 'trusted' : 'safe',
      created_at: row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : '',
      source: row.source || 'database',
      icon: row.icon,
      organization: row.organization_name,
      organization_icon: row.organization_icon,
    }));

    const maxPage = Math.ceil(total / perPage);

    return createSecureJsonResponse({
      success: true,
      source: 'database',
      category,
      mode: 'scam',
      page,
      maxPage: maxPage || 1,
      total,
      query,
      items,
    }, { status: 200 }, rateLimit);
  } catch (error) {
    console.error('Error fetching category data:', error);
    return createSecureJsonResponse(
      { success: false, error: 'Failed to fetch data', items: [] },
      { status: 500 },
      rateLimit
    );
  }
});

export const GET = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ error: 'Forbidden request origin' }, { status: 403 });
  }
  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'categories:get',
    windowMs: 60_000,
    maxRequests: 60,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  return createSecureJsonResponse({
    message: 'Use POST to fetch category data',
    categories: VALID_SCAM_TYPES,
    example: {
      category: 'websites',
      page: 1,
    },
  }, { status: 200 }, rateLimit);
});
