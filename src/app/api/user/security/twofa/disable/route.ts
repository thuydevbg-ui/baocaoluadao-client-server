import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { logUserActivity } from '@/lib/userActivity';

export const dynamic = 'force-dynamic';

export const POST = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: { password?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  await ensureUserInfra();
  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT id, password_hash FROM users WHERE email = ? LIMIT 1`,
    [session.user.email]
  );
  const record = rows?.[0];
  if (!record?.id) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  if (record?.password_hash) {
    const ok = await bcrypt.compare(body.password || '', record.password_hash);
    if (!ok) return NextResponse.json({ success: false, error: 'Mật khẩu xác thực không đúng' }, { status: 400 });
  }

  await db.query(
    `UPDATE users SET twofa_enabled = 0, twofa_secret = NULL, twofa_backup_codes = NULL, updated_at = NOW() WHERE email = ?`,
    [session.user.email]
  );

  await logUserActivity(record.id, 'security', 'Tắt 2FA', req).catch(() => {});

  return NextResponse.json({ success: true });
});
