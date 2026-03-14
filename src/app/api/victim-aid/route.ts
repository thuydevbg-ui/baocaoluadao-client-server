import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { getDb } from '@/lib/db';
import { ensureUserInfra } from '@/lib/userInfra';
import { getSessionEmail } from '@/lib/sessionEmail';

export const runtime = 'nodejs';

const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isMockEnabled = isDevOrTest && process.env.MOCK_DB === '1';
// SECURITY: Explicitly disable auto-create in production
const canAutoCreateUser = isDevOrTest && process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_IMPERSONATION === '1' && process.env.TEST_AUTO_CREATE_USER === '1';

async function getUserId(email: string) {
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  return rows?.[0]?.id as string | undefined;
}

export const GET = withApiObservability(async (req: NextRequest) => {
  const email = isMockEnabled ? 'mock@local' : await getSessionEmail(req);
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  if (isMockEnabled) {
    return NextResponse.json({ success: true, items: [{ id: 'VA-MOCK-1', need: 'psychology', state: 'open', description: 'Mock aid', createdAt: new Date().toISOString() }] });
  }

  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id, need, description, state, contact, createdAt FROM victim_aid_cases WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`, [userId]);
  return NextResponse.json({ success: true, items: rows || [] });
});

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

  const need = typeof body.need === 'string' ? body.need : '';
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 1500) : null;
  const contact = typeof body.contact === 'string' ? body.contact.trim().slice(0, 255) : null;
  if (!['psychology', 'finance', 'legal'].includes(need)) return NextResponse.json({ success: false, error: 'need must be psychology|finance|legal' }, { status: 400 });

  if (isMockEnabled) {
    return NextResponse.json({ success: true, id: `VA-MOCK-${crypto.randomUUID().slice(0, 6)}` });
  }

  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO victim_aid_cases (id, userId, need, description, state, contact, createdAt) VALUES (?, ?, ?, ?, 'open', ?, NOW())`,
    [id, userId, need, description, contact]
  );

  return NextResponse.json({ success: true, id });
});
