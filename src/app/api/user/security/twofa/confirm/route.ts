import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';
import { verifySync } from 'otplib';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { assertActiveDevice } from '@/lib/deviceSession';
import { logUserActivity } from '@/lib/userActivity';

export const dynamic = 'force-dynamic';

export const POST = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: { code?: string; password?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }
  const code = (body.code || '').trim();
  if (!code) return NextResponse.json({ success: false, error: 'Thiếu mã xác thực' }, { status: 400 });

  await ensureUserInfra();
  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT id, password_hash, twofa_secret, twofa_enabled FROM users WHERE email = ? LIMIT 1`,
    [session.user.email]
  );
  const record = rows?.[0];
  if (!record?.id) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  if (!record?.twofa_secret) return NextResponse.json({ success: false, error: 'Chưa khởi tạo 2FA' }, { status: 400 });
  if (record.twofa_enabled) return NextResponse.json({ success: false, error: '2FA đã bật' }, { status: 400 });
  const deviceCheck = await assertActiveDevice(req, record.id);
  if (!deviceCheck.allowed) return deviceCheck.response!;

  if (record?.password_hash) {
    const ok = await bcrypt.compare(body.password || '', record.password_hash);
    if (!ok) return NextResponse.json({ success: false, error: 'Mật khẩu xác thực không đúng' }, { status: 400 });
  }

  const result = verifySync({ secret: record.twofa_secret, token: code });
  if (!result.valid) return NextResponse.json({ success: false, error: 'Mã 2FA không đúng' }, { status: 400 });

  await db.query(
    `UPDATE users SET twofa_enabled = 1, updated_at = NOW() WHERE email = ?`,
    [session.user.email]
  );

  await logUserActivity(record.id, 'security', 'Bật 2FA', req).catch(() => {});

  return NextResponse.json({ success: true });
});
