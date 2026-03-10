/**
 * PhishTank handler
 * GET /api/phishtank
 */

import { createJsonResponse, createErrorResponse, getCacheHeaders, parseQueryParams } from '../utils';
import type { Env } from '../types';

export async function handlePhishTank(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const url = new URL(request.url);
  const params = parseQueryParams(url);

  const action = params.action || 'list';
  const targetUrl = params.url;
  const limit = parseInt(params.limit || '50', 10);

  // Try cache first for URL check
  if (action === 'check' && targetUrl && env.CACHE) {
    const cacheKey = `phishtank:check:${targetUrl}`;
    try {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return createJsonResponse(JSON.parse(cached), 200, origin, {
          ...corsHeaders,
          ...getCacheHeaders(300),
          'X-Cache': 'HIT',
        });
      }
    } catch (e) {
      // Continue
    }
  }

  let response: object;

  switch (action) {
    case 'check':
      if (!targetUrl) {
        return createErrorResponse('url parameter is required for check action', 400, origin, corsHeaders);
      }
      response = await checkPhishTank(targetUrl, env);
      break;

    case 'stats':
      response = await getPhishTankStats(env);
      break;

    case 'recent':
      response = await getRecentPhishes(limit, env);
      break;

    case 'list':
    default:
      response = await getPhishTankList(limit, env);
      break;
  }

  // Cache URL check results
  if (action === 'check' && targetUrl && env.CACHE) {
    const cacheKey = `phishtank:check:${targetUrl}`;
    ctx.waitUntil(env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 }));
  }

  return createJsonResponse({
    success: true,
    source: 'PhishTank',
    ...response,
  }, 200, origin, {
    ...corsHeaders,
    ...getCacheHeaders(action === 'check' ? 300 : 3600),
  });
}

async function checkPhishTank(url: string, env: Env): Promise<object> {
  // In production, use PhishTank API
  // https://www.phishtank.com/api_info.php
  
  // For now, return placeholder
  return {
    url,
    inDatabase: false,
    phishId: null,
    verified: false,
    verifiedAt: null,
  };
}

async function getPhishTankStats(env: Env): Promise<object> {
  // Return placeholder stats
  return {
    total: 0,
    verified: 0,
    lastUpdated: new Date().toISOString(),
  };
}

async function getRecentPhishes(limit: number, env: Env): Promise<object> {
  // Return placeholder data
  return {
    data: [],
    total: 0,
    limit,
  };
}

async function getPhishTankList(limit: number, env: Env): Promise<object> {
  // Return placeholder data
  return {
    data: [],
    total: 0,
    limit,
  };
}
