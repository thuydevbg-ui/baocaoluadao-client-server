import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { NextAuthOptions } from 'next-auth';
import { getDb } from './db';
import { RowDataPacket } from 'mysql2/promise';

// ============================================
// TYPES
// ============================================

export type UserRole = 'user' | 'moderator' | 'admin';
export type AuthProvider = 'credentials' | 'google' | 'facebook' | 'twitter' | 'telegram' | 'unknown';

export interface JWTPayload {
  sub: string;           // User ID
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  jti?: string;         // JWT ID for token rotation
}

export interface SessionRecord {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  access_token_jti: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthActivityRecord {
  id: string;
  user_id: string;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

// ============================================
// CONFIGURATION
// ============================================

export const AUTH_CONFIG = {
  // Access token expires in 15 minutes
  ACCESS_TOKEN_EXPIRY: 15 * 60, // seconds
  
  // Refresh token expires in 7 days
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // seconds
  
  // Cookie names
  ACCESS_TOKEN_COOKIE: 'auth_token',
  REFRESH_TOKEN_COOKIE: 'auth_refresh_token',
  
  // JWT secret - MUST be set in production
  get jwtSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_COOKIE_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET is required in production');
    }
    return secret || 'dev-only-insecure-secret';
  },
} as const;

// ============================================
// ADMIN COOKIE AUTH
// ============================================

export const COOKIE_NAME = 'adminAuth';

export interface AdminAuthPayload {
  email: string;
  role: string;
  name?: string;
  loginTime?: string;
}

function getAdminCookieSecret(): string {
  return AUTH_CONFIG.jwtSecret;
}

function signCookiePayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSignedCookieValue(payload: AdminAuthPayload): string {
  const secret = getAdminCookieSecret();
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = signCookiePayload(encoded, secret);
  return `${encoded}.${signature}`;
}

export function parseSignedCookie(value: string): AdminAuthPayload | null {
  if (typeof value !== 'string' || !value.includes('.')) return null;

  const parts = value.split('.');
  if (parts.length === 3) {
    try {
      const decoded = jwt.verify(value, getAdminCookieSecret()) as AdminAuthPayload;
      return decoded && typeof decoded.email === 'string' ? decoded : null;
    } catch {
      return null;
    }
  }

  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;

  const expected = signCookiePayload(encoded, getAdminCookieSecret());
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return null;
  if (!crypto.timingSafeEqual(expectedBuf, signatureBuf)) return null;

  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf8');
    const payload = JSON.parse(json) as AdminAuthPayload;
    if (!payload || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ============================================
// DATABASE HELPERS
// ============================================

/**
 * Ensure auth tables exist
 */
export async function ensureAuthInfrastructure(): Promise<void> {
  const db = getDb();

  // Create sessions table
  await db.query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      refresh_token_hash VARCHAR(255) NOT NULL,
      access_token_jti VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sessions_user (user_id),
      INDEX idx_sessions_expires (expires_at),
      INDEX idx_sessions_jti (access_token_jti),
      CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create auth_activity table
  await db.query(`
    CREATE TABLE IF NOT EXISTS auth_activity (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      action VARCHAR(50) NOT NULL,
      ip_address VARCHAR(45) DEFAULT NULL,
      user_agent VARCHAR(500) DEFAULT NULL,
      metadata JSON DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_activity_user (user_id),
      INDEX idx_activity_created (created_at),
      INDEX idx_activity_action (action),
      CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Ensure role column has moderator option
  await db.query(`ALTER TABLE users MODIFY COLUMN role ENUM('user', 'moderator', 'admin') NOT NULL DEFAULT 'user'`);
}

/**
 * Record user authentication activity
 */
export async function recordAuthActivity(
  userId: string,
  action: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const db = getDb();
    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO auth_activity (id, user_id, action, ip_address, user_agent, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, action, ipAddress || null, userAgent || null, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (error) {
    console.error('[Auth] Failed to record activity:', error);
  }
}

/**
 * Create a new session with refresh token
 */
export async function createSession(
  userId: string,
  refreshToken: string
): Promise<SessionRecord> {
  const db = getDb();
  const id = crypto.randomUUID();
  const jti = crypto.randomUUID();
  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  const expiresAt = new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRY * 1000);

  await db.query(
    `INSERT INTO auth_sessions (id, user_id, refresh_token_hash, access_token_jti, expires_at) VALUES (?, ?, ?, ?, ?)`,
    [id, userId, refreshTokenHash, jti, expiresAt]
  );

  return {
    id,
    user_id: userId,
    refresh_token_hash: refreshTokenHash,
    access_token_jti: jti,
    expires_at: expiresAt,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

/**
 * Validate refresh token and return session
 */
export async function validateRefreshToken(
  userId: string,
  refreshToken: string
): Promise<SessionRecord | null> {
  const db = getDb();
  
  // Get active sessions for user
  const [rows] = await db.query<SessionRecord[] & RowDataPacket[]>(
    `SELECT * FROM auth_sessions 
     WHERE user_id = ? AND expires_at > NOW() 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  );

  if (!rows[0]) {
    return null;
  }

  const session = rows[0];
  
  // Verify refresh token
  const isValid = await bcrypt.compare(refreshToken, session.refresh_token_hash);
  if (!isValid) {
    return null;
  }

  return session;
}

/**
 * Invalidate a session (logout)
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  const db = getDb();
  await db.query(`DELETE FROM auth_sessions WHERE id = ?`, [sessionId]);
}

/**
 * Invalidate all user sessions (force logout everywhere)
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const db = getDb();
  await db.query(`DELETE FROM auth_sessions WHERE user_id = ?`, [userId]);
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = getDb();
  const [result] = await db.query(`DELETE FROM auth_sessions WHERE expires_at < NOW()`);
  return (result as any).affectedRows || 0;
}

// ============================================
// JWT FUNCTIONS
// ============================================

/**
 * Generate access token (JWT)
 */
export function generateAccessToken(
  userId: string,
  email: string,
  role: UserRole,
  jti?: string
): string {
  const payload = {
    sub: userId,
    email,
    role,
    ...(jti && { jti }),
  };

  return jwt.sign(payload, AUTH_CONFIG.jwtSecret, {
    expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate refresh token (opaque, not JWT)
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.jwtSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload | null;
  } catch {
    return null;
  }
}

// ============================================
// PASSWORD HELPERS
// ============================================

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, uppercase, number
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất một chữ cái in hoa');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất một số');
  }
  
  // Additional recommended checks
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Mật khẩu nên chứa ít nhất một ký tự đặc biệt');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// COOKIE OPTIONS
// ============================================

/**
 * Get cookie options for access token
 */
export function getAccessTokenCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: AUTH_CONFIG.ACCESS_TOKEN_EXPIRY,
    path: '/',
  };
}

/**
 * Get cookie options for refresh token
 */
export function getRefreshTokenCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRY,
    path: '/',
  };
}

/**
 * Get cookie options for clearing tokens
 */
export function getClearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
  };
}

// ============================================
// SESSION INFO
// ============================================

/**
 * Get session info for client
 */
export interface SessionInfo {
  userId: string;
  email: string;
  name: string | null;
  role: UserRole;
  image: string | null;
  expiresAt: Date;
}

export async function getSessionInfo(userId: string): Promise<SessionInfo | null> {
  const db = getDb();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, email, name, image, role FROM users WHERE id = ?`,
    [userId]
  );
  
  if (!rows[0]) return null;
  
  return {
    userId: rows[0].id,
    email: rows[0].email,
    name: rows[0].name,
    role: rows[0].role as UserRole,
    image: rows[0].image,
    expiresAt: new Date(Date.now() + AUTH_CONFIG.ACCESS_TOKEN_EXPIRY * 1000),
  };
}
