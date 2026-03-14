import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { assertActiveDevice } from '@/lib/deviceSession';
import { logUserActivity } from '@/lib/userActivity';

export const dynamic = 'force-dynamic';

export const PATCH = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: { enabled?: boolean; password?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

  const enabled = Boolean(body.enabled);

  await ensureUserInfra();
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT password_hash FROM users WHERE email = ? LIMIT 1`, [session.user.email]);
  const record = rows?.[0];
  if (!record) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const [idRows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [session.user.email]);
  const userId = idRows?.[0]?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const deviceCheck = await assertActiveDevice(req, userId);
  if (!deviceCheck.allowed) return deviceCheck.response!;
  if (record?.password_hash) {
    const ok = await bcrypt.compare(body.password || '', record.password_hash);
    if (!ok) return NextResponse.json({ success: false, error: 'Mật khẩu xác thực không đúng' }, { status: 400 });
  }

  await db.query(`UPDATE users SET twofa_enabled = ?, updated_at = NOW() WHERE email = ?`, [enabled ? 1 : 0, session.user.email]);
  await logUserActivity(userId, 'security', enabled ? 'Bật 2FA (nhanh)' : 'Tắt 2FA (nhanh)', req).catch(() => {});

  return NextResponse.json({ success: true, enabled });
});
