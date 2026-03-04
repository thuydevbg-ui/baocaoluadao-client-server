import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/rateLimit';
import { createSignedCookieValue } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { recordAdminActivity } from '@/lib/dbQueries';
import { validateEnvironment } from '@/lib/env-validation';

// Validate environment on module load
validateEnvironment();

const COOKIE_NAME = 'adminAuth';

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP.trim();
  return 'unknown';
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  try {
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
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: rateLimitResult.retryAfter ? { 'Retry-After': String(rateLimitResult.retryAfter) } : {},
        }
      );
    }

    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
    const password = typeof body?.password === 'string' ? body.password.slice(0, 128) : '';
    const rememberMe = Boolean(body?.rememberMe);

    if (!email || !password) {
      return NextResponse.json({ error: 'Thieu email hoac mat khau' }, { status: 400 });
    }

    const db = getDb();
    const [rows] = await db.query<import('mysql2/promise').RowDataPacket[]>(
      `SELECT id, email, password_hash, name, role, status
       FROM admin_users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const admin = rows[0];

    // Always perform bcrypt comparison to prevent timing attacks
    // Use a dummy hash with same length as real bcrypt (60 chars) when admin doesn't exist
    // Stored in env var to avoid exposing in source code
    const dummyHash = process.env.DUMMY_BCRYPT_HASH || '';
    if (!dummyHash && process.env.NODE_ENV === 'production') {
      throw new Error('DUMMY_BCRYPT_HASH environment variable is required in production');
    }
    const fallbackHash = dummyHash || '$2b$12$ULm72h4KeqGAhIkAX28tnef1waSjucCCs4JMSq6vxd/gE0cNC3vCm';
    const storedHash = admin?.password_hash || fallbackHash;
    const validPassword = await bcrypt.compare(password, storedHash);

    // Only allow if admin exists, is active, and password is valid
    const isAllowed = Boolean(admin && admin.status === 'active' && validPassword);

    if (!isAllowed) {
      await recordAdminActivity({
        action: 'Dang nhap admin that bai',
        user: email,
        target: email,
        status: 'failed',
        ip,
      });
      return NextResponse.json({ error: 'Email hoac mat khau khong dung' }, { status: 401 });
    }

    await db.execute(`UPDATE admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?`, [admin.id]);

    await recordAdminActivity({
      action: 'Dang nhap admin',
      user: admin.email,
      target: admin.id,
      status: 'success',
      ip,
    });

    const authData = createSignedCookieValue({
      email: admin.email,
      role: admin.role,
      name: admin.name,
      loginTime: new Date().toISOString(),
    });

    const response = NextResponse.json({ success: true });
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    response.cookies.set(COOKIE_NAME, authData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    await recordAdminActivity({
      action: 'Dang nhap admin loi he thong',
      user: 'unknown',
      target: 'auth/login',
      status: 'failed',
      ip,
    });
    return NextResponse.json({ error: 'Loi server' }, { status: 500 });
  }
}
