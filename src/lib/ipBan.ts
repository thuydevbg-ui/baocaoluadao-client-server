import { NextRequest } from 'next/server';
import { getDb } from './db';

const TABLE = 'ip_bans';

export async function ensureIpBanTable() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      ip VARCHAR(64) NOT NULL PRIMARY KEY,
      reason VARCHAR(255) NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function getClientIp(req: NextRequest): string | null {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  return realIp ?? null;
}

export async function isIpBanned(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  await ensureIpBanTable();
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT ip FROM ${TABLE} WHERE ip = ? LIMIT 1`, [ip]);
  return Array.isArray(rows) && rows.length > 0;
}

export async function banIp(ip: string | null, reason = 'api-docs unauthorized') {
  if (!ip) return;
  await ensureIpBanTable();
  const db = getDb();
  await db.query(`INSERT IGNORE INTO ${TABLE} (ip, reason) VALUES (?, ?)`, [ip, reason]);
}
