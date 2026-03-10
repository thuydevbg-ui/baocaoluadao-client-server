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

    // In production, increment view count in database
    // For now, return success with view count
    const result = {
      success: true,
      detailKey,
      views: 1, // Would be incremented in production
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
