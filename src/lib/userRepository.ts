import crypto from 'crypto';
import { RowDataPacket } from 'mysql2/promise';
import { getDb } from './db';
import { ensureUserInfra } from './userInfra';

export type AuthProvider = 'credentials' | 'google' | 'facebook' | 'twitter' | 'telegram' | 'unknown';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  image: string | null;
  passwordHash: string | null;
  provider: AuthProvider;
  role: 'user' | 'admin';
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  image: string | null;
  password_hash: string | null;
  provider: AuthProvider;
  role: 'user' | 'admin';
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row?: UserRow): UserRecord | null {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    passwordHash: row.password_hash,
    provider: row.provider || 'unknown',
    role: row.role || 'user',
    lastLoginAt: row.last_login_at ? row.last_login_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function newId() {
  return crypto.randomUUID();
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [rows] = await db.query<UserRow[]>(
    `SELECT id, email, name, image, password_hash, provider, role, last_login_at, created_at, updated_at
     FROM users WHERE email = ? LIMIT 1`,
    [normalized]
  );
  return mapRow(rows[0]);
}

export async function createUserWithPassword(options: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const db = getDb();
  await ensureUserInfra();
  const id = newId();
  const normalizedEmail = options.email.trim().toLowerCase();

  await db.query(
    `INSERT INTO users (id, email, name, password_hash, provider, role, email_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'credentials', 'user', 0, NOW(), NOW())`,
    [id, normalizedEmail, options.name.trim(), options.passwordHash]
  );

  return (await findUserByEmail(normalizedEmail))!;
}

export async function upsertOAuthUser(options: {
  email: string;
  name?: string | null;
  image?: string | null;
  providerAccountId?: string | null;
  provider: AuthProvider;
}): Promise<UserRecord> {
  const db = getDb();
  await ensureUserInfra();
  const normalizedEmail = options.email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);

  if (existing) {
    await db.query(
      `UPDATE users
       SET name = COALESCE(?, name),
           image = COALESCE(?, image),
           provider = ?,
           email_verified = 1,
           updated_at = NOW()
       WHERE id = ?`,
      [options.name?.trim() || existing.name, options.image || existing.image, options.provider, existing.id]
    );

    if (options.providerAccountId) {
      await ensureAccountLink(existing.id, options.provider, options.providerAccountId);
    }

    return (await findUserByEmail(normalizedEmail))!;
  }

  const id = newId();
  await db.query(
    `INSERT INTO users (id, email, name, image, provider, role, email_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'user', 1, NOW(), NOW())`,
    [id, normalizedEmail, options.name?.trim() || normalizedEmail, options.image || null, options.provider]
  );

  if (options.providerAccountId) {
    await ensureAccountLink(id, options.provider, options.providerAccountId);
  }

  const created = await findUserByEmail(normalizedEmail);
  if (!created) {
    throw new Error('Failed to create OAuth user');
  }
  return created;
}

export async function updateUserLoginMeta(id: string): Promise<void> {
  const db = getDb();
  await db.query(
    `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?`,
    [id]
  );
}

export async function markOAuthLink(email: string, provider: AuthProvider, connected: boolean) {
  const db = getDb();
  await db.query(
    `UPDATE users SET oauth_connected = ?, oauth_provider = ?, updated_at = NOW() WHERE email = ?`,
    [connected ? 1 : 0, connected ? provider : null, email]
  );
}

async function ensureAccountLink(userId: string, provider: AuthProvider, providerAccountId: string) {
  const db = getDb();
  const accountId = newId();

  await db.query(
    `INSERT INTO user_accounts (id, user_id, provider, provider_account_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)`,
    [accountId, userId, provider, providerAccountId]
  );
}
