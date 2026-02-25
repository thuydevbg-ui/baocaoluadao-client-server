import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { COOKIE_NAME, createSignedCookieValue } from '@/lib/auth';
import { recordAdminActivity } from '@/lib/adminManagementStore';

// Optional Redis for production rate limiting
let redisClient: any = null;
async function getRedisClient() {
  if (redisClient) return redisClient;
  
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) return null;
  
  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({ url: REDIS_URL, token: process.env.REDIS_TOKEN || '' });
    return redisClient;
  } catch {
    console.warn('Redis not available, falling back to in-memory rate limiting');
    return null;
  }
}

// Environment variables for admin credentials
// IMPORTANT: ADMIN_PASSWORD should be bcrypt HASHED, not plain text!
// To generate a hash: bcrypt.hash('your-password', 10)
const _adminEmail = process.env.ADMIN_EMAIL;
const _adminPasswordHash = process.env.ADMIN_PASSWORD_HASH; // NEW: bcrypt hashed password
const _adminPassword = process.env.ADMIN_PASSWORD; // Legacy: plain text password (deprecated)
const _adminRole = process.env.ADMIN_ROLE || 'admin';

// Validate admin configuration - require either new hashed password or legacy plain text
if (!_adminEmail) {
  throw new Error('ADMIN_EMAIL environment variable is required');
}

// Security: Require hashed password in production - no plain text passwords allowed
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !_adminPasswordHash) {
  throw new Error('FATAL: ADMIN_PASSWORD_HASH environment variable is required in production. Plain text passwords are not allowed for security reasons.');
}

if (!_adminPasswordHash && !_adminPassword) {
  throw new Error('ADMIN_PASSWORD_HASH environment variable is required');
}

// DEPRECATED: Plain text password support - only for local development
// Will be removed in future versions
const ADMIN_EMAIL = _adminEmail; // Admin email for login
const ADMIN_PASSWORD_HASH = _adminPasswordHash; // bcrypt hash
const ADMIN_PASSWORD = process.env.NODE_ENV !== 'production' ? _adminPassword : undefined; // legacy - production disabled
const ADMIN_ROLE = _adminRole;

/**
 * Verify password against bcrypt hash only (plain text disabled in production)
 */
async function verifyPassword(password: string): Promise<boolean> {
  // First try bcrypt hash if available
  if (ADMIN_PASSWORD_HASH) {
    try {
      return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } catch (err) {
      console.error('Bcrypt comparison error:', err);
      return false;
    }
  }
  
  // Fallback to legacy plain text comparison (development only - disabled in production)
  if (ADMIN_PASSWORD) {
    return constantTimeEqual(password, ADMIN_PASSWORD);
  }
  
  return false;
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Uses crypto.timingSafeEqual for secure comparison
 */
function constantTimeEqual(a: string, b: string): boolean {
  try {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    
    // timingSafeEqual throws if buffers have different lengths
    if (aBuffer.length !== bBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(aBuffer, bBuffer);
  } catch {
    // If comparison fails, return false (fail closed)
    return false;
  }
}

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  resetTime: number;
}

// In-memory fallback rate limiter
const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BAN_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_MAP_SIZE = 10000;

// NOTE: For production, use Redis for distributed rate limiting.
// Set REDIS_URL environment variable to enable Redis-based rate limiting.
// In-memory limiter works for single-server deployments only.

let rateLimitCleanupStarted = false;

function cleanupRateLimitMap() {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitMap.forEach((record, ip) => {
    if (now > record.resetTime && now > record.firstAttempt + WINDOW_MS) {
      keysToDelete.push(ip);
    }
  });

  if (rateLimitMap.size > MAX_MAP_SIZE) {
    const sortedEntries = Array.from(rateLimitMap.entries()).sort((a, b) => a[1].firstAttempt - b[1].firstAttempt);
    const toRemove = sortedEntries.slice(0, MAX_MAP_SIZE / 2);
    toRemove.forEach(([key]) => keysToDelete.push(key));
  }

  keysToDelete.forEach((ip) => rateLimitMap.delete(ip));
}

// Start cleanup interval only once - at module load time
// This ensures cleanup runs even in serverless if the container stays warm
if (typeof setInterval !== 'undefined' && !rateLimitCleanupStarted) {
  rateLimitCleanupStarted = true;
  setInterval(cleanupRateLimitMap, CLEANUP_INTERVAL_MS);
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

function checkRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter?: number; isBanned?: boolean }> {
  // Use Redis in production if available, fallback to in-memory
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Try Redis for distributed rate limiting in production
    return checkRateLimitRedis(ip);
  }
  
  // In-memory rate limiter for development
  return Promise.resolve(checkRateLimitMemory(ip));
}

/**
 * Redis-based rate limiting for production/multi-instance deployments
 * Uses Upstash Redis with sliding window algorithm
 */
async function checkRateLimitRedis(ip: string): Promise<{ allowed: boolean; retryAfter?: number; isBanned?: boolean }> {
  const redis = await getRedisClient();
  
  if (!redis) {
    // Redis not available, fallback to memory (not recommended for production)
    console.warn('⚠️ Redis not configured, falling back to in-memory rate limiting in production!');
    return checkRateLimitMemory(ip);
  }
  
  const key = `ratelimit:login:${ip}`;
  const windowSeconds = Math.floor(WINDOW_MS / 1000);
  const banSeconds = Math.floor(BAN_MS / 1000);
  
  try {
    // Use Upstash Redis INCR with TTL for atomic counter
    const count = await redis.incr(key);
    
    if (count === 1) {
      // First request, set expiry
      await redis.expire(key, windowSeconds);
    }
    
    if (count > MAX_ATTEMPTS) {
      // User is banned
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        retryAfter: ttl > 0 ? ttl : banSeconds,
        isBanned: true,
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fail open if Redis fails - allow request but log error
    return { allowed: true };
  }
}

/**
 * In-memory rate limiting for development/single-server deployments
 * TODO: For production, implement Redis-based rate limiting:
 * - Set REDIS_URL environment variable
 * - Use @upstash/redis for distributed rate limiting
 */
function checkRateLimitMemory(ip: string): { allowed: boolean; retryAfter?: number; isBanned?: boolean } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (record && record.resetTime > now && record.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
      isBanned: true,
    };
  }

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    if (rateLimitMap.size >= MAX_MAP_SIZE) {
      cleanupRateLimitMap();
      if (rateLimitMap.size >= MAX_MAP_SIZE) {
        return { allowed: false, retryAfter: 60 };
      }
    }

    rateLimitMap.set(ip, {
      count: 1,
      firstAttempt: now,
      resetTime: now + WINDOW_MS,
    });
    return { allowed: true };
  }

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.resetTime = now + BAN_MS;
    return {
      allowed: false,
      retryAfter: Math.ceil(BAN_MS / 1000),
      isBanned: true,
    };
  }

  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimitResult = await checkRateLimit(ip);

    if (!rateLimitResult.allowed) {
      recordAdminActivity({
        action: rateLimitResult.isBanned ? 'Dang nhap bi chan tam thoi' : 'Vuot gioi han dang nhap',
        user: 'unknown',
        target: '/admin/login',
        status: 'warning',
        ip,
      });

      const response = NextResponse.json(
        {
          error: rateLimitResult.isBanned
            ? 'Tai khoan bi tam khoa do dang nhap sai qua nhieu lan. Vui long thu lai sau.'
            : 'Qua nhieu lan thu dang nhap. Vui long thu lai sau.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: rateLimitResult.retryAfter ? { 'Retry-After': String(rateLimitResult.retryAfter) } : {},
        }
      );

      response.headers.set('X-RateLimit-Limit', String(MAX_ATTEMPTS));
      response.headers.set('X-RateLimit-Remaining', '0');
      if (rateLimitResult.retryAfter) {
        response.headers.set('X-RateLimit-Reset', String(rateLimitResult.retryAfter));
      }

      return response;
    }

    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
    const isProduction = process.env.NODE_ENV === 'production';

    if (origin && isProduction && allowedOrigins.length === 0) {
      return NextResponse.json(
        { error: 'CORS not configured. Set ALLOWED_ORIGINS environment variable (comma-separated list of allowed domains)' },
        { status: 403 }
      );
    }

    if (origin && allowedOrigins.length > 0) {
      const isAllowedOrigin = allowedOrigins.some((allowed) => {
        // Exact match or proper subdomain match
        const normalizedAllowed = allowed.trim();
        const normalizedOrigin = origin.trim();
        return normalizedOrigin === normalizedAllowed ||
               normalizedOrigin === `https://${normalizedAllowed}` ||
               normalizedOrigin === `http://${normalizedAllowed}`;
      });
      if (!isAllowedOrigin) {
        return NextResponse.json({ error: 'Yeu cau khong duoc phep' }, { status: 403 });
      }
    }

    let body: { email?: string; password?: string; rememberMe?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = body?.email;
    const password = body?.password;
    const rememberMe = body?.rememberMe === true;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password must be strings' }, { status: 400 });
    }

    if (!email.trim() || !password.trim()) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Use async password verification with bcrypt (or legacy plain text)
    const isPasswordValid = await verifyPassword(password);
    
    // Verify email with constant-time comparison to prevent timing attacks
    const isEmailValid = constantTimeEqual(email, ADMIN_EMAIL);
    
    if (!isEmailValid || !isPasswordValid) {
      recordAdminActivity({
        action: 'Dang nhap that bai',
        user: email,
        target: '/admin/login',
        status: 'failed',
        ip,
      });

      return NextResponse.json({ error: 'Email hoac mat khau khong dung' }, { status: 401 });
    }

    const authData = createSignedCookieValue({
      email,
      role: ADMIN_ROLE,
      name: 'Admin User',
      loginTime: new Date().toISOString(),
    });

    const response = NextResponse.json({ success: true });
    // Remember me: 30 days, otherwise 24 hours
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
    response.cookies.set(COOKIE_NAME, authData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });

    recordAdminActivity({
      action: 'Dang nhap admin',
      user: email,
      target: '/admin',
      status: 'success',
      ip,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Loi server noi bo' }, { status: 500 });
  }
}
