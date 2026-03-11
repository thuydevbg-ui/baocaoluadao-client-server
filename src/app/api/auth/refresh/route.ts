import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '@/lib/auth';

// ============================================
// TYPES
// ============================================

interface SessionRow extends RowDataPacket {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  access_token_jti: string;
  expires_at: Date;
}

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
}

// ============================================
// CONFIG
// ============================================

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP.trim();
  return 'unknown';
}

/**
 * Generate new access token
 */
function generateAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { sub: userId, email, role },
    AUTH_CONFIG.jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate new refresh token
 */
function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Verify refresh token against stored hash
 */
async function verifyRefreshToken(storedHash: string, providedToken: string): Promise<boolean> {
  return bcrypt.compare(providedToken, storedHash);
}

/**
 * Create response with auth cookies
 */
function createAuthResponse(
  userId: string,
  email: string,
  name: string | null,
  role: string,
  image: string | null,
  newRefreshToken: string
): NextResponse {
  // Generate new access token
  const accessToken = generateAccessToken(userId, email, role);

  const response = NextResponse.json({
    success: true,
    user: {
      id: userId,
      email,
      name,
      role,
      image,
    },
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  // Set access token cookie
  response.cookies.set(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_EXPIRY,
    path: '/',
  });

  // Set refresh token cookie
  response.cookies.set(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY,
    path: '/',
  });

  return response;
}

// ============================================
// HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get(AUTH_CONFIG.REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    const db = getDb();

    // Find session with this refresh token
    const [sessions] = await db.query<SessionRow[]>(
      `SELECT * FROM auth_sessions 
       WHERE expires_at > NOW() 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (!sessions[0]) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      );
    }

    const session = sessions[0];

    // Verify refresh token
    const isValid = await verifyRefreshToken(session.refresh_token_hash, refreshToken);
    
    if (!isValid) {
      // Token might be compromised - invalidate all sessions
      await db.query(`DELETE FROM auth_sessions WHERE user_id = ?`, [session.user_id]);
      
      console.warn('[REFRESH] Invalid refresh token, sessions invalidated for user:', session.user_id);
      
      return NextResponse.json(
        { error: 'Invalid refresh token. Please login again.' },
        { status: 401 }
      );
    }

    // Get user details
    const [users] = await db.query<UserRow[]>(
      `SELECT id, email, name, image, role FROM users WHERE id = ?`,
      [session.user_id]
    );

    if (!users[0]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Generate new tokens (refresh token rotation)
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);

    // Update session with new refresh token
    await db.query(
      `UPDATE auth_sessions 
       SET refresh_token_hash = ?, expires_at = ?, updated_at = NOW() 
       WHERE id = ?`,
      [newRefreshTokenHash, newExpiresAt, session.id]
    );

    // Log activity
    try {
      const activityId = crypto.randomUUID();
      await db.query(
        `INSERT INTO auth_activity (id, user_id, action, ip_address) VALUES (?, ?, ?, ?)`,
        [activityId, user.id, 'token_refresh', ip]
      );
    } catch (err) {
      console.error('[REFRESH] Failed to log activity:', err);
    }

    // Return new tokens
    return createAuthResponse(
      user.id,
      user.email,
      user.name,
      user.role,
      user.image,
      newRefreshToken
    );

  } catch (error) {
    console.error('[REFRESH] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
