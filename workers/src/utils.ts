/**
 * Utility functions for Cloudflare Workers
 */

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;
  
  // Check various headers in order of preference
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;
  
  return 'unknown';
}

/**
 * Validate request origin
 */
export function validateRequestOrigin(request: Request, origin: string | null): boolean {
  // Allow requests from:
  // - Our main domain
  // - localhost for development
  // - Cloudflare Workers preview
  
  const allowedOrigins = [
    'https://baocaoluadao.com',
    'https://www.baocaoluadao.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
  
  // Always allow if no origin header (same-origin requests)
  if (!origin) return true;
  
  // Allow if origin is in allowed list
  if (allowedOrigins.includes(origin)) return true;
  
  // Allow workers.dev preview domains
  if (origin.includes('.workers.dev')) return true;
  
  return false;
}

/**
 * Get CORS headers based on origin
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    'https://baocaoluadao.com',
    'https://www.baocaoluadao.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  
  const isAllowed = !origin || 
    allowedOrigins.includes(origin) || 
    origin.includes('.workers.dev');
  
  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Create JSON response with CORS headers
 */
export function createJsonResponse(
  data: unknown,
  status: number = 200,
  origin: string | null,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(origin),
      ...extraHeaders,
    },
  });
}

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  status: number,
  origin: string | null,
  extraHeaders: Record<string, string> = {},
  errorDetails?: string
): Response {
  const body: Record<string, unknown> = {
    success: false,
    error: message,
  };
  
  if (errorDetails && process.env.ENVIRONMENT !== 'production') {
    body.details = errorDetails;
  }
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(origin),
      ...extraHeaders,
    },
  });
}

/**
 * Create CORS response for preflight
 */
export function createCorsResponse(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Sanitize input string
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input) return '';
  return input.trim().slice(0, maxLength);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized || normalized.length > 253) return false;
  
  // Block private/internal IPs
  const blockedPatterns = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^0\.\d+\.\d+\.\d+$/,
    /^::1$/i,
    /^fe80:/i,
  ];
  
  if (blockedPatterns.some((pattern) => pattern.test(normalized))) {
    return false;
  }
  
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(normalized);
}

/**
 * Validate phone number format (Vietnam)
 */
export function isValidPhone(phone: string): boolean {
  // Vietnamese phone formats
  const phoneRegex = /^(\+84|84|0)[3-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Parse query parameters
 */
export function parseQueryParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/**
 * Generate cache control headers
 */
export function getCacheHeaders(maxAge: number, isPublic: boolean = true): Record<string, string> {
  return {
    'Cache-Control': `${isPublic ? 'public' : 'private'}, max-age=${maxAge}, s-maxage=${maxAge}`,
    'Vary': 'Accept-Encoding, Origin',
  };
}

/**
 * Generate no-cache headers
 */
export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  };
}
