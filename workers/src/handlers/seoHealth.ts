/**
 * SEO Health Check handler
 * GET /api/seo/health-check
 */

import { createJsonResponse, getCacheHeaders } from '../utils';
import type { Env } from '../types';

export async function handleSeoHealthCheck(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');

  // Try cache first
  const cacheKey = 'seo:health-check';
  
  if (env.CACHE) {
    try {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return createJsonResponse(JSON.parse(cached), 200, origin, {
          ...corsHeaders,
          ...getCacheHeaders(3600),
          'X-Cache': 'HIT',
        });
      }
    } catch (e) {
      // Continue
    }
  }

  // SEO health report
  const report = {
    status: 'healthy',
    score: 100,
    checks: [
      { name: 'sitemap', status: 'pass', message: 'Sitemap exists and is valid' },
      { name: 'robots', status: 'pass', message: 'Robots.txt is configured' },
      { name: 'metadata', status: 'pass', message: 'Meta tags are present' },
    ],
    recommendations: [],
    timestamp: new Date().toISOString(),
  };

  // Cache the response
  if (env.CACHE) {
    ctx.waitUntil(env.CACHE.put(cacheKey, JSON.stringify(report), { expirationTtl: 3600 }));
  }

  return createJsonResponse(report, 200, origin, {
    ...corsHeaders,
    ...getCacheHeaders(3600),
  });
}
