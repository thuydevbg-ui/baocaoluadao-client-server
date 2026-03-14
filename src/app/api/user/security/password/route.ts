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

  let body: { currentPassword?: string; newPassword?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

  const newPassword = body.newPassword?.trim() || '';
  const currentPassword = body.currentPassword?.trim() || '';
  if (newPassword.length < 8) return NextResponse.json({ success: false, error: 'Mật khẩu tối thiểu 8 ký tự' }, { status: 400 });

  await ensureUserInfra();
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id, password_hash FROM users WHERE email = ? LIMIT 1`, [session.user.email]);
  const user = rows?.[0];
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const deviceCheck = await assertActiveDevice(req, user.id);
  if (!deviceCheck.allowed) return deviceCheck.response!;

  if (user.password_hash) {
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) return NextResponse.json({ success: false, error: 'Mật khẩu hiện tại không đúng' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query(`UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`, [hashed, user.id]);

  await logUserActivity(user.id, 'security', 'Đổi mật khẩu', req).catch(() => {});

  return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' });
});
