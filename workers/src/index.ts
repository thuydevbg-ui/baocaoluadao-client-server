/**
 * Cloudflare Workers API for baocaoluadao.com
 * 
 * This Worker handles public API endpoints:
 * - /report - Submit scam report
 * - /scan - Scan website for threats
 * - /scams - Get scams list
 * - /categories - Get categories
 * - /stats - Get statistics
 * - /health - Health check
 * - /phishtank - PhishTank lookup
 * - /policy-violations/lookup - Policy violation lookup
 * - /seo/health-check - SEO health check
 * - /settings/public - Public settings
 * - /detail-feedback - Detail feedback
 * - /detail-views - Detail views tracking
 * - /risk/analyze - Risk analysis
 */

import { createCorsResponse, createJsonResponse, createErrorResponse, getClientIP, validateRequestOrigin } from './utils';
import { handleReport } from './handlers/report';
import { handleScan } from './handlers/scan';
import { handleScams } from './handlers/scams';
import { handleCategories } from './handlers/categories';
import { handleStats } from './handlers/stats';
import { handleHealth } from './handlers/health';
import { handlePhishTank } from './handlers/phishtank';
import { handlePolicyViolationLookup } from './handlers/policyViolation';
import { handleSeoHealthCheck } from './handlers/seoHealth';
import { handlePublicSettings } from './handlers/publicSettings';
import { handleDetailFeedback } from './handlers/detailFeedback';
import { handleDetailViews } from './handlers/detailViews';
import { handleRiskAnalyze } from './handlers/riskAnalyze';
import type { Env } from './types';

// Rate limiting storage (in-memory for demonstration)
// In production, use Cloudflare Rate Limiting or KV store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter function
 * Uses simple in-memory storage - for production use Cloudflare Rate Limiting
 */
function checkRateLimit(ip: string, endpoint: string, maxRequests: number, windowMs: number): boolean {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

/**
 * CORS headers for allowed origins
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    'https://baocaoluadao.com',
    'https://www.baocaoluadao.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  
  // In production, add your domain
  const isAllowed = !origin || allowedOrigins.includes(origin) || origin.endsWith('.workers.dev');
  
  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handle OPTIONS preflight requests
 */
function handlePreflight(request: Request): Response {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(origin),
    },
  });
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handlePreflight(request);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\//, '/'); // Remove /api/ prefix
    const method = request.method;
    const ip = getClientIP(request);
    const origin = request.headers.get('Origin');

    // Security: Validate origin
    if (!validateRequestOrigin(request, origin)) {
      return createErrorResponse('Forbidden', 403, origin);
    }

    // Add CORS headers to all responses
    const corsHeaders = getCorsHeaders(origin);

    try {
      // Route handling
      // Note: path starts with / after removing /api/ prefix
      
      // Health check - no rate limit
      if (path === '/health' && method === 'GET') {
        return handleHealth(request, env, ctx, corsHeaders);
      }

      // Rate limiting for other endpoints
      // Different limits based on endpoint sensitivity
      const rateLimits: Record<string, { max: number; window: number }> = {
        '/report': { max: 10, window: 60000 },       // 10 requests/minute
        '/scan': { max: 20, window: 60000 },         // 20 requests/minute
        '/scams': { max: 60, window: 60000 },        // 60 requests/minute
        '/categories': { max: 60, window: 60000 },   // 60 requests/minute
        '/stats': { max: 30, window: 60000 },       // 30 requests/minute
        '/policy-violations/lookup': { max: 30, window: 60000 },
        '/detail-feedback': { max: 20, window: 60000 },
        '/detail-views': { max: 60, window: 60000 },
        '/risk/analyze': { max: 10, window: 60000 },
        '/phishtank': { max: 30, window: 60000 },
        '/seo/health-check': { max: 10, window: 60000 },
        '/settings/public': { max: 120, window: 60000 },
      };

      const rateLimit = rateLimits[path];
      if (rateLimit && !checkRateLimit(ip, path, rateLimit.max, rateLimit.window)) {
        return createErrorResponse('Too Many Requests', 429, origin, {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(rateLimit.max),
          'X-RateLimit-Remaining': '0',
        });
      }

      // Route to appropriate handler
      switch (path) {
        // Report submission
        case '/report':
          if (method === 'POST') {
            return handleReport(request, env, ctx, corsHeaders);
          }
          return createErrorResponse('Method Not Allowed', 405, origin);

        // Website scanning
        case '/scan':
          if (method === 'POST') {
            return handleScan(request, env, ctx, corsHeaders);
          }
          return createErrorResponse('Method Not Allowed', 405, origin);

        // Scams list
        case '/scams':
          return handleScams(request, env, ctx, corsHeaders);

        // Categories
        case '/categories':
          return handleCategories(request, env, ctx, corsHeaders);

        // Statistics
        case '/stats':
          return handleStats(request, env, ctx, corsHeaders);

        // PhishTank
        case '/phishtank':
          return handlePhishTank(request, env, ctx, corsHeaders);

        // Policy violations lookup
        case '/policy-violations/lookup':
          if (method === 'POST') {
            return handlePolicyViolationLookup(request, env, ctx, corsHeaders);
          }
          return createErrorResponse('Method Not Allowed', 405, origin);

        // SEO health check
        case '/seo/health-check':
          return handleSeoHealthCheck(request, env, ctx, corsHeaders);

        // Public settings
        case '/settings/public':
          return handlePublicSettings(request, env, ctx, corsHeaders);

        // Detail feedback
        case '/detail-feedback':
          return handleDetailFeedback(request, env, ctx, corsHeaders);

        // Detail views
        case '/detail-views':
          return handleDetailViews(request, env, ctx, corsHeaders);

        // Risk analysis
        case '/risk/analyze':
          if (method === 'POST') {
            return handleRiskAnalyze(request, env, ctx, corsHeaders);
          }
          return createErrorResponse('Method Not Allowed', 405, origin);

        // Default: 404
        default:
          return createErrorResponse('Not Found', 404, origin);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return createErrorResponse(
        'Internal Server Error',
        500,
        origin,
        {},
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  },
};
