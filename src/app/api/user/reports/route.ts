import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { adjustProfileSummary, ensureProfileSummary } from '@/lib/userSummary';
import { getSessionEmail } from '@/lib/sessionEmail';

const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isMockEnabled = isDevOrTest && process.env.MOCK_DB === '1';
// SECURITY: Explicitly disable auto-create in production
const canAutoCreateUser = isDevOrTest && process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_IMPERSONATION === '1' && process.env.TEST_AUTO_CREATE_USER === '1';

const MOCK_USER_ID = 'USER-MOCK';

async function getUserId(email: string) {
  if (isMockEnabled) return MOCK_USER_ID;
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

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

  if (isMockEnabled) {
    return NextResponse.json({
      success: true,
      items: [
        { id: 'RPT-MOCK-1', type: 'website', target: 'phishing.example.com', riskScore: 72, status: 'pending', createdAt: new Date().toISOString() },
        { id: 'RPT-MOCK-2', type: 'phone', target: '0987654321', riskScore: 88, status: 'processing', createdAt: new Date().toISOString() },
      ],
    });
  }

  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT id, type, target, riskScore, status, createdAt
     FROM user_reports
     WHERE userId = ?
     ORDER BY createdAt DESC
     LIMIT ?`,
    [userId, limit]
  );

  return NextResponse.json({ success: true, items: rows || [] });
});

export const POST = withApiObservability(async (req: NextRequest) => {
  const email = isMockEnabled ? 'mock@local' : await getSessionEmail(req);
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  let body: { type?: string; target?: string; riskScore?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const type = (body.type || 'website').slice(0, 40);
  const target = (body.target || '').trim().slice(0, 500);
  const riskScore = Number.isFinite(body.riskScore) ? Math.max(0, Math.min(100, Number(body.riskScore))) : 0;

  if (!target) return NextResponse.json({ success: false, error: 'target required' }, { status: 400 });

  if (isMockEnabled) {
    return NextResponse.json({ success: true, id: `RPT-MOCK-${crypto.randomUUID().slice(0, 6)}` });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  await ensureProfileSummary(userId);
  await db.query(
    `INSERT INTO user_reports (id, userId, type, target, riskScore, status, createdAt)
     VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
    [id, userId, type, target, riskScore]
  );

  await adjustProfileSummary(userId, { reportsCount: 1 });
  await db.query(
    `INSERT INTO user_activity (id, userId, type, description, createdAt) VALUES (?, ?, 'report', ?, NOW())`,
    [crypto.randomUUID(), userId, `Gửi báo cáo ${target}`]
  );

  return NextResponse.json({ success: true, id });
});
