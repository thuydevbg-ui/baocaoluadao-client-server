/**
 * Public Settings handler
 * GET /api/settings/public
 */

import { createJsonResponse, getCacheHeaders } from '../utils';
import type { Env } from '../types';

export async function handlePublicSettings(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');

  // Try cache first
  const cacheKey = 'settings:public';
  
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

  // Public settings
  const settings = {
    success: true,
    siteName: 'Báo Cáo Lừa Đảo',
    siteDescription: 'Nền tảng báo cáo và tra cứu lừa đảo trực tuyến',
    contactEmail: 'contact@baocaoluadao.com',
    features: {
      allowAnonymousReports: true,
      showStatistics: true,
      enableSearch: true,
    },
    socialLinks: {
      facebook: 'https://facebook.com/baocaoluadao',
    },
    lastUpdated: new Date().toISOString(),
  };

  // Cache the response
  if (env.CACHE) {
    ctx.waitUntil(env.CACHE.put(cacheKey, JSON.stringify(settings), { expirationTtl: 3600 }));
  }

  return createJsonResponse(settings, 200, origin, {
    ...corsHeaders,
    ...getCacheHeaders(3600),
  });
}
