import { getDb } from './db';

export interface UserProfileSummary {
  reportsCount: number;
  watchlistCount: number;
  alertCount: number;
}

export async function ensureProfileSummary(userId: string) {
  const db = getDb();
  await db.query(`INSERT INTO user_profile_summary (userId) VALUES (?) ON DUPLICATE KEY UPDATE updatedAt = VALUES(updatedAt)`, [userId]);
}

export async function adjustProfileSummary(
  userId: string,
  changes: Partial<Record<keyof UserProfileSummary, number>>
) {
  const db = getDb();
  const expressions: string[] = [];
  const params: (number | string)[] = [];

  if (changes.reportsCount !== undefined) {
    expressions.push('reportsCount = GREATEST(reportsCount + ?, 0)');
    params.push(changes.reportsCount);
  }
  if (changes.watchlistCount !== undefined) {
    expressions.push('watchlistCount = GREATEST(watchlistCount + ?, 0)');
    params.push(changes.watchlistCount);
  }
  if (changes.alertCount !== undefined) {
    expressions.push('alertCount = GREATEST(alertCount + ?, 0)');
    params.push(changes.alertCount);
  }

  if (!expressions.length) return;

  params.push(userId);
  await db.query(
    `UPDATE user_profile_summary SET ${expressions.join(', ')}, updatedAt = NOW() WHERE userId = ?`,
    params
  );
}

export async function getProfileSummary(userId: string): Promise<UserProfileSummary> {
  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT reportsCount, watchlistCount, alertCount FROM user_profile_summary WHERE userId = ? LIMIT 1`,
    [userId]
  );
  const row = rows?.[0];
  return {
    reportsCount: Number(row?.reportsCount ?? 0),
    watchlistCount: Number(row?.watchlistCount ?? 0),
    alertCount: Number(row?.alertCount ?? 0),
  };
}
