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

  let siteName = 'Báo Cáo Lừa Đảo';
  let siteDescription = 'Nền tảng báo cáo và tra cứu lừa đảo trực tuyến';
  let reportsEnabled = true;
  let aiScanEnabled = true;

  if (env.DB) {
    try {
      const rows = await env.DB.prepare(
        `
          SELECT key, value
          FROM site_settings
          WHERE key IN ('site_name', 'site_description', 'reports_enabled', 'ai_scan_enabled')
        `
      ).all<{ key: string; value: string }>();
      if (rows.success && rows.results) {
        for (const row of rows.results) {
          if (row.key === 'site_name' && row.value) siteName = row.value;
          if (row.key === 'site_description' && row.value) siteDescription = row.value;
          if (row.key === 'reports_enabled') reportsEnabled = row.value === 'true';
          if (row.key === 'ai_scan_enabled') aiScanEnabled = row.value === 'true';
        }
      }
    } catch (error) {
      console.error('D1 settings error:', error);
    }
  }

  const settings = {
    success: true,
    siteName,
    siteDescription,
    contactEmail: 'contact@baocaoluadao.com',
    features: {
      allowAnonymousReports: reportsEnabled,
      showStatistics: true,
      enableSearch: true,
      enableAiScan: aiScanEnabled,
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
