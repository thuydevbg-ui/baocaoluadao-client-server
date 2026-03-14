import { getDb } from '../src/lib/db';
import { ensureUserInfra } from '../src/lib/userInfra';
import crypto from 'crypto';

async function main() {
  const db = getDb();
  await ensureUserInfra();

  const minutes = Number(process.env.ALERT_WINDOW_MINUTES || 15);
  const [scams] = await db.query<any[]>(
    `SELECT id, type, value, risk_level AS riskLevel, status, description, created_at AS createdAt
     FROM scams
     WHERE (status = 'blocked' OR risk_level = 'high')
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [minutes]
  );

  let inserted = 0;

  for (const scam of scams as any[]) {
    const level = scam.status === 'blocked' || scam.riskLevel === 'high' ? 'danger' : 'warning';
    const [watchers] = await db.query<any[]>(
      `SELECT id, userId FROM watchlist WHERE type = ? AND target = ?`,
      [scam.type, scam.value]
    );

    for (const watcher of watchers as any[]) {
      const id = crypto.randomUUID();
      await db.query(
        `INSERT IGNORE INTO alerts (id, userId, watchlistId, scamId, target, type, level, message, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [id, watcher.userId, watcher.id, scam.id, scam.value, scam.type, level, scam.description || 'Phát hiện trong blacklist']
      );
      inserted += 1;
    }
  }

  console.log(`Alert worker processed ${scams.length} scams, inserted ${inserted} alerts`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Alert worker error', err);
  process.exit(1);
});
