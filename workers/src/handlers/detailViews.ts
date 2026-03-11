/**
 * Detail Views handler
 * POST /api/detail-views
 */

import { createJsonResponse, createErrorResponse, sanitizeInput } from '../utils';
import type { Env } from '../types';
import type { DetailViewsRequest } from '../types';

export async function handleDetailViews(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');

  try {
    const body: DetailViewsRequest = await request.json();

    // Validate required fields
    if (!body.detailKey) {
      return createErrorResponse('detailKey is required', 400, origin, corsHeaders);
    }

    const detailKey = sanitizeInput(body.detailKey, 255);

    let views = 1;
    if (env.DB) {
      const now = Date.now();
      await env.DB.prepare(
        `
          INSERT INTO detail_view_counts (detail_key, views, created_at, updated_at)
          VALUES (?, 1, ?, ?)
          ON CONFLICT(detail_key) DO UPDATE SET
            views = views + 1,
            updated_at = excluded.updated_at
        `
      ).bind(detailKey, now, now).run();

      const row = await env.DB.prepare(
        `SELECT views FROM detail_view_counts WHERE detail_key = ?`
      ).bind(detailKey).first<{ views: number }>();
      views = row?.views || 1;
    }

    const result = {
      success: true,
      detailKey,
      views,
      timestamp: new Date().toISOString(),
    };

    return createJsonResponse(result, 200, origin, corsHeaders);

  } catch (error) {
    if (error instanceof SyntaxError) {
      return createErrorResponse('Invalid JSON body', 400, origin, corsHeaders);
    }
    throw error;
  }
}
