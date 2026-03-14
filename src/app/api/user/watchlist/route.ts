import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { adjustProfileSummary, ensureProfileSummary } from '@/lib/userSummary';
import { getSessionEmail } from '@/lib/sessionEmail';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

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

export const GET = withApiObservability(async (req) => {
  const email = isMockEnabled ? 'mock@local' : await getSessionEmail(req);
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  if (isMockEnabled) {
    return NextResponse.json({
      success: true,
      items: [
        { id: 'WL-MOCK-1', target: '0987654321', type: 'phone', createdAt: new Date().toISOString() },
        { id: 'WL-MOCK-2', target: 'phishing.example.com', type: 'website', createdAt: new Date().toISOString() },
      ],
    });
  }

  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT id, target, type, createdAt FROM watchlist WHERE userId = ? ORDER BY createdAt DESC`,
    [userId]
  );
  return NextResponse.json({ success: true, items: rows || [] });
});

export const POST = withApiObservability(async (req: NextRequest) => {
  const email = isMockEnabled ? 'mock@local' : await getSessionEmail(req);
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  let body: { target?: string; type?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const target = (body.target || '').trim().slice(0, 300);
  const type = (body.type || 'website').slice(0, 40);
  if (!target) return NextResponse.json({ success: false, error: 'target required' }, { status: 400 });

  if (isMockEnabled) {
    return NextResponse.json({ success: true, id: `WL-MOCK-${crypto.randomUUID().slice(0, 6)}` });
  }

  const db = getDb();
  await ensureProfileSummary(userId);
  await db.query(
    `INSERT INTO watchlist (id, userId, target, type, createdAt) VALUES (?, ?, ?, ?, NOW())`,
    [crypto.randomUUID(), userId, target, type]
  );
  await adjustProfileSummary(userId, { watchlistCount: 1, alertCount: 1 });
  return NextResponse.json({ success: true });
});
