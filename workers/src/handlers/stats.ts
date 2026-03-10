/**
 * Statistics handler
 * GET /api/stats
 */

import { createJsonResponse, getCacheHeaders } from '../utils';
import type { Env } from '../types';
import type { Stats } from '../types';

interface DbStatsRow {
  website_count: number;
  organization_count: number;
  device_count: number;
  phone_count: number;
  email_count: number;
  social_count: number;
  sms_count: number;
  bank_count: number;
  total_count: number;
}

export async function handleStats(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');

  // Try cache first
  const cacheKey = 'stats:dashboard';
  
  if (env.CACHE) {
    try {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return createJsonResponse(JSON.parse(cached), 200, origin, {
          ...corsHeaders,
          ...getCacheHeaders(60), // 1 min cache
          'X-Cache': 'HIT',
        });
      }
    } catch (e) {
      // Continue
    }
  }

  // Try to get stats from D1 database
  let stats: Stats;

  try {
    if (env.DB) {
      const result = await env.DB.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'website' THEN 1 ELSE 0 END), 0) as website_count,
          COALESCE(SUM(CASE WHEN type = 'organization' THEN 1 ELSE 0 END), 0) as organization_count,
          COALESCE(SUM(CASE WHEN type = 'device' THEN 1 ELSE 0 END), 0) as device_count,
          COALESCE(SUM(CASE WHEN type = 'phone' THEN 1 ELSE 0 END), 0) as phone_count,
          COALESCE(SUM(CASE WHEN type = 'email' THEN 1 ELSE 0 END), 0) as email_count,
          COALESCE(SUM(CASE WHEN type = 'social' THEN 1 ELSE 0 END), 0) as social_count,
          COALESCE(SUM(CASE WHEN type = 'sms' THEN 1 ELSE 0 END), 0) as sms_count,
          COALESCE(SUM(CASE WHEN type = 'bank' THEN 1 ELSE 0 END), 0) as bank_count,
          COUNT(*) as total_count
        FROM scams 
        WHERE is_scam = 1
      `).first<DbStatsRow>();

      if (result) {
        stats = {
          website: result.website_count || 0,
          organization: result.organization_count || 0,
          device: result.device_count || 0,
          phone: result.phone_count || 0,
          email: result.email_count || 0,
          social: result.social_count || 0,
          sms: result.sms_count || 0,
          bank: result.bank_count || 0,
          total: result.total_count || 0,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        stats = {
          website: 0,
          organization: 0,
          device: 0,
          phone: 0,
          email: 0,
          social: 0,
          sms: 0,
          bank: 0,
          total: 0,
          lastUpdated: new Date().toISOString(),
        };
      }
    } else {
      // No D1 binding
      stats = {
        website: 0,
        organization: 0,
        device: 0,
        phone: 0,
        email: 0,
        social: 0,
        sms: 0,
        bank: 0,
        total: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('D1 query error:', error);
    stats = {
      website: 0,
      organization: 0,
      device: 0,
      phone: 0,
      email: 0,
      social: 0,
      sms: 0,
      bank: 0,
      total: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  const response = {
    success: true,
    ...stats,
  };

  // Cache the response
  if (env.CACHE) {
    ctx.waitUntil(env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 60 }));
  }

  return createJsonResponse(response, 200, origin, {
    ...corsHeaders,
    ...getCacheHeaders(60),
  });
}
