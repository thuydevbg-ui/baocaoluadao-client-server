import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { getSessionEmail } from '@/lib/sessionEmail';
import crypto from 'crypto';

const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isMockEnabled = isDevOrTest && process.env.MOCK_DB === '1';
// SECURITY: Explicitly disable auto-create in production
const canAutoCreateUser = isDevOrTest && process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_IMPERSONATION === '1' && process.env.TEST_AUTO_CREATE_USER === '1';

const MOCK_ALERTS = [
  {
    id: 'ALERT-MOCK-1',
    target: '0987654321',
    type: 'phone',
    status: 'danger',
    message: 'Số này đã bị tố giác 12 lần',
    createdAt: new Date().toISOString(),
  },
];

async function getUserId(email: string) {
  if (isMockEnabled) return 'USER-MOCK';
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  const found = rows?.[0]?.id as string | undefined;
  if (found) return found;
  if (canAutoCreateUser) {
    const newId = crypto.randomUUID();
    await db.query(
      `INSERT IGNORE INTO users (id, email, name, provider, role, created_at, updated_at) VALUES (?, ?, ?, 'credentials', 'user', NOW(), NOW())`,
      [newId, email, email.split('@')[0] || 'Test User']
    );
    return newId;
  }
  return undefined;
}

export const GET = withApiObservability(async (req: NextRequest) => {
  const email = isMockEnabled ? 'mock@local' : await getSessionEmail(req);
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  const db = getDb();
  const [stored] = await db.query<any[]>(
    `SELECT id, target, type, level AS status, message, createdAt FROM alerts WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`,
    [userId]
  );

  if ((stored as any[])?.length) {
    return NextResponse.json({ success: true, items: stored });
  }

  if (isMockEnabled) {
    return NextResponse.json({ success: true, items: MOCK_ALERTS });
  }

  const [watchRows] = await db.query<any[]>(`SELECT target, type FROM watchlist WHERE userId = ?`, [userId]);
  if (!watchRows?.length) return NextResponse.json({ success: true, items: [] });

  const alerts: any[] = [];
  for (const row of watchRows) {
    const [scams] = await db.query<any[]>(
      `SELECT id, value, type, risk_level AS riskLevel, status, report_count AS reportCount, description
       FROM scams
       WHERE type = ? AND value = ?
       LIMIT 1`,
      [row.type, row.target]
    );
    const match = scams?.[0];
    if (match) {
      const status = match.riskLevel === 'high' || match.status === 'blocked' ? 'danger' : match.riskLevel === 'medium' ? 'suspected' : 'info';
      alerts.push({
        id: match.id,
        target: match.value,
        type: match.type,
        status,
        message: match.description || 'Phát hiện trong danh sách cảnh báo',
        reportCount: match.reportCount,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ success: true, items: alerts });
});

export const runtime = 'nodejs';
