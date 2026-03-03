import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/rateLimit';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@baocaoluadao.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'admin';
const COOKIE_NAME = 'adminAuth';

// Validate required secret - never use default in production
const AUTH_COOKIE_SECRET = process.env.AUTH_COOKIE_SECRET;
if (!AUTH_COOKIE_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[CRITICAL] AUTH_COOKIE_SECRET environment variable is required in production');
  }
  console.warn('[WARNING] AUTH_COOKIE_SECRET not set, using dev secret (NOT SAFE FOR PRODUCTION)');
}
const COOKIE_SECRET = AUTH_COOKIE_SECRET || 'dev-secret-do-not-use-in-production';

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP.trim();
  return 'unknown';
}

async function verifyPassword(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD_HASH) return false;
  try {
    console.log('[VERIFY] Comparing password with hash:', ADMIN_PASSWORD_HASH.substring(0, 20) + '...');
    const result = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    console.log('[VERIFY] bcrypt.compare result:', result);
    return result;
  } catch (e) {
    console.log('[VERIFY] Error:', e);
    return false;
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

function createSignedCookie(payload: object): string {
  const hmac = crypto.createHmac('sha256', COOKIE_SECRET);
  const data = JSON.stringify(payload);
  hmac.update(data);
  return JSON.stringify({ d: data, s: hmac.digest('base64url') });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent brute force attacks
    const ip = getClientIP(request);
    const rateLimitResult = await checkRateLimit({
      scope: 'admin-login',
      key: ip,
      maxAttempts: AUTH_RATE_LIMIT.maxAttempts,
      windowSeconds: AUTH_RATE_LIMIT.windowMs / 1000,
      banSeconds: AUTH_RATE_LIMIT.banSeconds,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitResult.isBanned 
            ? 'Tai khoan bi tam khoa do dang nhap sai qua nhieu lan. Vui long thu lai sau.'
            : 'Qua nhieu lan thu dang nhap. Vui long thu lai sau.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: rateLimitResult.retryAfter ? { 'Retry-After': String(rateLimitResult.retryAfter) } : {}
        }
      );
    }

    const body = await request.json();
    const { email, password, rememberMe } = body || {};

    // DEBUG
    console.log('[LOGIN DEBUG] Received body:', JSON.stringify(body));
    console.log('[LOGIN DEBUG] Password received:', password);

    if (!email || !password) {
      return NextResponse.json({ error: 'Thieu email hoac mat khau' }, { status: 400 });
    }

    const passwordValid = await verifyPassword(password);
    const emailValid = constantTimeEqual(email, ADMIN_EMAIL);
    
    // DEBUG
    console.log('[LOGIN DEBUG] Email:', email, '| ADMIN_EMAIL:', ADMIN_EMAIL);
    console.log('[LOGIN DEBUG] Email valid:', emailValid);
    console.log('[LOGIN DEBUG] Password valid:', passwordValid);
    console.log('[LOGIN DEBUG] ADMIN_PASSWORD_HASH:', ADMIN_PASSWORD_HASH ? 'set' : 'NOT SET');

    if (!emailValid || !passwordValid) {
      return NextResponse.json({ error: 'Email hoac mat khau khong dung' }, { status: 401 });
    }

    const authData = createSignedCookie({
      email,
      role: ADMIN_ROLE,
      name: 'Admin',
      loginTime: new Date().toISOString()
    });

    const response = NextResponse.json({ success: true });
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    response.cookies.set(COOKIE_NAME, authData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    return NextResponse.json({ error: 'Loi server' }, { status: 500 });
  }
}
