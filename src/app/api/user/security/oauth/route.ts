import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export const PATCH = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: { connected?: boolean; password?: string; provider?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

  const connected = Boolean(body.connected);
  const provider = (body.provider || 'google').toLowerCase();

  await ensureUserInfra();
  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT id, password_hash FROM users WHERE email = ? LIMIT 1`,
    [session.user.email]
  );
  const record = rows?.[0];
  if (record?.password_hash) {
    const ok = await bcrypt.compare(body.password || '', record.password_hash);
    if (!ok) return NextResponse.json({ success: false, error: 'Mật khẩu xác thực không đúng' }, { status: 400 });
  }

  await db.query(
    `UPDATE users SET oauth_connected = ?, oauth_provider = ?, updated_at = NOW() WHERE email = ?`,
    [connected ? 1 : 0, connected ? provider : null, session.user.email]
  );

  if (record?.id) {
    const action = connected ? 'Liên kết' : 'Hủy liên kết';
    const providerLabel = provider === 'twitter' ? 'X (Twitter)' : provider === 'google' ? 'Google' : provider === 'facebook' ? 'Facebook' : provider;
    await db
      .query(
        `INSERT INTO user_activity (id, userId, type, description, createdAt) VALUES (?, ?, 'security', ?, NOW())`,
        [crypto.randomUUID(), record.id, `${action} OAuth: ${providerLabel}`]
      )
      .catch(() => {});
  }

  return NextResponse.json({ success: true, connected });
});
