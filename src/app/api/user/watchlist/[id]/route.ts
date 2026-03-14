import { NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { adjustProfileSummary } from '@/lib/userSummary';
import { getSessionEmail } from '@/lib/sessionEmail';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isMockEnabled = isDevOrTest && process.env.MOCK_DB === '1';
// SECURITY: Explicitly disable auto-create in production
const canAutoCreateUser = isDevOrTest && process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_IMPERSONATION === '1' && process.env.TEST_AUTO_CREATE_USER === '1';

const MOCK_USER_ID = 'USER-MOCK';

export const DELETE = withApiObservability(async (_req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
  const email = isMockEnabled ? 'mock@local' : await getSessionEmail(_req);
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (isMockEnabled) {
    return NextResponse.json({ success: true, deletedId: id });
  }

  await ensureUserInfra();
  const db = getDb();
  const [userRows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  let userId = userRows?.[0]?.id as string | undefined;
  if (!userId && canAutoCreateUser) {
    userId = crypto.randomUUID();
    await db.query(
      `INSERT IGNORE INTO users (id, email, name, provider, role, created_at, updated_at) VALUES (?, ?, ?, 'credentials', 'user', NOW(), NOW())`,
      [userId, email, email.split('@')[0] || 'Test User']
    );
  }
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  const [result] = await db.query(`DELETE FROM watchlist WHERE id = ? AND userId = ? LIMIT 1`, [id, userId]);
  const deleted = ((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
  if (deleted) {
    await adjustProfileSummary(userId, { watchlistCount: -1, alertCount: -1 });
  }
  return NextResponse.json({ success: true });
});
