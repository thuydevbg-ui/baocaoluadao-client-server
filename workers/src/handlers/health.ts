/**
 * Health check handler
 */

import { createJsonResponse, getNoCacheHeaders } from '../utils';
import type { Env } from '../index';

export async function handleHealth(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');
  
  // Basic health check response
  // In production, you can add database and other service checks
  const health = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT || 'development',
    services: {
      api: 'ok',
    },
  };
  
  return createJsonResponse(health, 200, origin, {
    ...getNoCacheHeaders(),
  });
}
