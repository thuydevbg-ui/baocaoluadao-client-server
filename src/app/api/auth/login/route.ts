import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { COOKIE_NAME, createSignedCookieValue } from '@/lib/auth';
import { recordAdminActivity } from '@/lib/adminManagementStore';
import { AUTH_RATE_LIMIT, checkRateLimit } from '@/lib/rateLimit';

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

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimitResult = await checkRateLimit({
      scope: 'admin-login',
      key: ip,
      ...AUTH_RATE_LIMIT,
    });

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

      response.headers.set('X-RateLimit-Limit', String(AUTH_RATE_LIMIT.maxAttempts));
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
