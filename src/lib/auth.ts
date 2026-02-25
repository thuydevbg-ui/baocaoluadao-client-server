import crypto from 'crypto';

const _cookieSecret = process.env.AUTH_COOKIE_SECRET;

// CRITICAL SECURITY: Fail fast in production if AUTH_COOKIE_SECRET is not set
// This prevents accidental deployment with the insecure default secret
if (!_cookieSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: AUTH_COOKIE_SECRET environment variable is required in production. Deployment blocked for security.');
  }
  // Development mode: use a default secret but warn developer
  console.warn('⚠️ SECURITY WARNING: AUTH_COOKIE_SECRET not set. Using insecure default for development only!');
  console.warn('Please create a .env.local file with AUTH_COOKIE_SECRET for any real usage.');
  console.warn('To set up: AUTH_COOKIE_SECRET=$(openssl rand -base64 32)');
}

export const COOKIE_SECRET = _cookieSecret || 'dev-only-insecure-secret-do-not-use-in-prod';
export const COOKIE_NAME = 'adminAuth';
export const MAX_LOGIN_AGE_HOURS = 24;

export interface AdminAuthPayload {
  email: string;
  role: string;
  name: string;
  loginTime: string;
}

/**
 * Sign data with HMAC SHA-256
 */
export function signCookie(data: string): string {
  const hmac = crypto.createHmac('sha256', COOKIE_SECRET);
  hmac.update(data);
  return hmac.digest('base64url');
}

/**
 * Verify signed cookie data using timing-safe comparison
 */
export function verifySignedCookie(signedData: string, signature: string): string | null {
  const expectedSignature = signCookie(signedData);
  try {
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    // timingSafeEqual throws if buffers have different lengths
    if (sigBuffer.length !== expectedBuffer.length) {
      return null;
    }
    
    // Use timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }
    return signedData;
  } catch {
    return null;
  }
}

/**
 * Create signed cookie value from payload
 */
export function createSignedCookieValue(payload: AdminAuthPayload): string {
  const data = JSON.stringify(payload);
  const signature = signCookie(data);
  return JSON.stringify({ d: data, s: signature });
}

/**
 * Parse and verify signed cookie, returning the auth payload if valid
 * Returns null if cookie is invalid, expired, or malformed
 */
export function parseSignedCookie(cookieValue: string): AdminAuthPayload | null {
  try {
    const parsed = JSON.parse(cookieValue);
    if (!parsed.d || !parsed.s) return null;
    
    const data = verifySignedCookie(parsed.d, parsed.s);
    if (!data) return null;
    
    const payload = JSON.parse(data) as AdminAuthPayload;
    if (payload.email && payload.role && payload.loginTime) {
      // Check if login is not too old
      const loginTime = new Date(payload.loginTime);
      const now = new Date();
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLogin <= MAX_LOGIN_AGE_HOURS) {
        return payload;
      }
    }
    return null;
  } catch {
    return null;
  }
}
