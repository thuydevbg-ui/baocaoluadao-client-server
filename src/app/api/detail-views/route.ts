import { NextRequest } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';
import { getDb } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface ViewRow extends RowDataPacket {
  views: number;
}

function normalizeDetailKey(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const value = raw.trim().toLowerCase();
  if (!value || value.length > 220) return '';
  if (!value.includes(':')) return '';
  if (!/^[a-z0-9:_-]+$/.test(value)) return '';
  return value;
}

async function getViews(detailKey: string): Promise<number> {
  const db = getDb();
  const [rows] = await db.query<ViewRow[]>('SELECT views FROM detail_view_counts WHERE detail_key = ? LIMIT 1', [detailKey]);
  const views = rows?.[0]?.views;
  return Number.isFinite(views) ? Math.max(0, Math.floor(views)) : 0;
}

export const GET = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ success: false, error: 'Forbidden request origin' }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'detail-views:get',
    windowMs: 60_000,
    maxRequests: 300,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ success: false, error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  const detailKey = normalizeDetailKey(request.nextUrl.searchParams.get('detailKey'));
  if (!detailKey) {
    return createSecureJsonResponse({ success: false, error: 'detailKey is required' }, { status: 400 }, rateLimit);
  }

  try {
    const views = await getViews(detailKey);
    return createSecureJsonResponse({ success: true, detailKey, views }, { status: 200 }, rateLimit);
  } catch (error) {
    console.error('[detail-views] GET failed:', error);
    return createSecureJsonResponse({ success: true, detailKey, views: 0 }, { status: 200 }, rateLimit);
  }
});

export const POST = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ success: false, error: 'Forbidden request origin' }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'detail-views:post',
    windowMs: 60_000,
    maxRequests: 120,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ success: false, error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  const body = await request.json().catch(() => ({}));
  const detailKey = normalizeDetailKey(body?.detailKey);
  if (!detailKey) {
    return createSecureJsonResponse({ success: false, error: 'detailKey is required' }, { status: 400 }, rateLimit);
  }

  const nowMs = Date.now();

  try {
    const db = getDb();
    await db.execute(
      `
        INSERT INTO detail_view_counts (detail_key, views, created_at, updated_at)
        VALUES (?, 1, ?, ?)
        ON DUPLICATE KEY UPDATE
          views = views + 1,
          updated_at = ?
      `,
      [detailKey, nowMs, nowMs, nowMs]
    );

    const views = await getViews(detailKey);
    return createSecureJsonResponse({ success: true, detailKey, views }, { status: 200 }, rateLimit);
  } catch (error) {
    console.error('[detail-views] POST failed:', error);
    return createSecureJsonResponse({ success: true, detailKey, views: 0 }, { status: 200 }, rateLimit);
  }
});

