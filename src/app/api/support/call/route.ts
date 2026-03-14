import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { getSessionEmail } from '@/lib/sessionEmail';

export const runtime = 'nodejs';

const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isMockEnabled = isDevOrTest && process.env.MOCK_DB === '1';
// SECURITY: Explicitly disable auto-create in production
const canAutoCreateUser = isDevOrTest && process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_IMPERSONATION === '1' && process.env.TEST_AUTO_CREATE_USER === '1';

async function getUserId(email: string) {
  if (isMockEnabled) return 'USER-MOCK';
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  return rows?.[0]?.id as string | undefined;
}

export const POST = withApiObservability(async (req: NextRequest) => {
  const email = isMockEnabled ? 'mock@local' : await getSessionEmail(req);
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const db = getDb();
  let userId = await getUserId(email);
  if (!userId && canAutoCreateUser) {
    userId = crypto.randomUUID();
    await db.query(`INSERT IGNORE INTO users (id, email, name, provider, role, created_at, updated_at) VALUES (?, ?, ?, 'credentials', 'user', NOW(), NOW())`, [userId, email, email.split('@')[0] || 'Test User']);
  }
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

  const line = typeof body.line === 'string' ? body.line : '';
  const callbackNumber = typeof body.callbackNumber === 'string' ? body.callbackNumber.trim().slice(0, 40) : null;
  if (!['113','114','111','expert'].includes(line)) return NextResponse.json({ success: false, error: 'line must be 113|114|111|expert' }, { status: 400 });

  if (isMockEnabled) {
    return NextResponse.json({ success: true, id: `CALL-MOCK-${crypto.randomUUID().slice(0, 6)}` });
  }

  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO support_calls (id, userId, line, callbackNumber, status, createdAt) VALUES (?, ?, ?, ?, 'queued', NOW())`,
    [id, userId, line, callbackNumber]
  );

  // In real system, trigger call provider here.

  return NextResponse.json({ success: true, id, status: 'queued' });
});
