/**
 * Policy Violation Lookup handler
 * POST /api/policy-violations/lookup
 */

import { createJsonResponse, createErrorResponse, isValidDomain, sanitizeInput } from '../utils';
import type { Env } from '../types';
import type { PolicyViolationLookupRequest } from '../types';

export async function handlePolicyViolationLookup(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');

  try {
    const body: PolicyViolationLookupRequest = await request.json();
    
    const raw = typeof body?.url === 'string' ? body.url : (typeof body?.domain === 'string' ? body.domain : '');
    
    if (!raw.trim()) {
      return createErrorResponse('url or domain is required', 400, origin, corsHeaders);
    }

    const domain = sanitizeInput(raw, 253).toLowerCase();
    
    if (!isValidDomain(domain)) {
      return createErrorResponse('Invalid domain format', 400, origin, corsHeaders);
    }

    // Check cache first
    const cacheKey = `policy:${domain}`;
    
    if (env.CACHE) {
      try {
        const cached = await env.CACHE.get(cacheKey);
        if (cached) {
          return createJsonResponse(JSON.parse(cached), 200, origin, {
            ...corsHeaders,
            'X-Cache': 'HIT',
          });
        }
      } catch (e) {
        // Continue
      }
    }

    let violation: any = null;
    if (env.DB) {
      try {
        const row = await env.DB.prepare(
          `
            SELECT
              domain,
              violation_summary,
              source_name,
              source_url,
              source_title,
              source_published_at,
              first_seen_at,
              last_seen_at
            FROM policy_violations
            WHERE domain = ?
            ORDER BY last_seen_at DESC
            LIMIT 1
          `
        ).bind(domain).first<Record<string, any>>();
        if (row) {
          violation = row;
        }
      } catch (error) {
        console.error('D1 policy lookup error:', error);
      }
    }

    const result = {
      success: true,
      domain,
      found: Boolean(violation),
      violation,
      checkedAt: new Date().toISOString(),
    };

    // Cache the result
    if (env.CACHE) {
      ctx.waitUntil(env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 }));
    }

    return createJsonResponse(result, 200, origin, corsHeaders);

  } catch (error) {
    if (error instanceof SyntaxError) {
      return createErrorResponse('Invalid JSON body', 400, origin, corsHeaders);
    }
    throw error;
  }
}
