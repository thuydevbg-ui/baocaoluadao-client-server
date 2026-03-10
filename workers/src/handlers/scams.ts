/**
 * Scams list handler
 * GET /api/scams
 */

import { createJsonResponse, getCacheHeaders, parseQueryParams } from '../utils';
import type { Env } from '../types';
import type { ScamType } from '../types';

// Fallback data when database is unavailable
const FALLBACK_SCAMS: ScamType[] = [];

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
  const type = params.type;
  const search = params.search;

  // Try to get from cache first
  const cacheKey = `scams:${page}:${limit}:${type || 'all'}:${search || ''}`;
  
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

  // In production, query database
  // For now, return fallback data
  const scams: ScamType[] = FALLBACK_SCAMS;

  // Filter by type if specified
  let filteredScams = scams;
  if (type) {
    filteredScams = filteredScams.filter(s => s.type === type);
  }

  // Filter by search if specified
  if (search) {
    const searchLower = search.toLowerCase();
    filteredScams = filteredScams.filter(s => 
      s.value.toLowerCase().includes(searchLower) ||
      s.description.toLowerCase().includes(searchLower)
    );
  }

  // Paginate
  const start = (page - 1) * limit;
  const paginatedScams = filteredScams.slice(start, start + limit);

  const response = {
    success: true,
    data: paginatedScams,
    pagination: {
      page,
      limit,
      total: filteredScams.length,
      totalPages: Math.ceil(filteredScams.length / limit),
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
