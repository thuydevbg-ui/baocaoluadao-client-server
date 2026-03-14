import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { assertActiveDevice } from '@/lib/deviceSession';
import { logUserActivity } from '@/lib/userActivity';

export const dynamic = 'force-dynamic';

function generateBackupCodes() {
  return Array.from({ length: 6 }, () => crypto.randomBytes(6).toString('hex'));
}

export const POST = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: { password?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  await ensureUserInfra();
  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT id, password_hash, twofa_enabled FROM users WHERE email = ? LIMIT 1`,
    [session.user.email]
  );
  const record = rows?.[0];
  if (!record?.id) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  const deviceCheck = await assertActiveDevice(req, record.id);
  if (!deviceCheck.allowed) return deviceCheck.response!;

  if (!record.twofa_enabled) {
    return NextResponse.json({ success: false, error: '2FA chưa được bật' }, { status: 400 });
  }

  if (record?.password_hash) {
    const ok = await bcrypt.compare(body.password || '', record.password_hash);
    if (!ok) return NextResponse.json({ success: false, error: 'Mật khẩu xác thực không đúng' }, { status: 400 });
  }

  const backupCodes = generateBackupCodes();

  await db.query(
    `UPDATE users SET twofa_backup_codes = ?, updated_at = NOW() WHERE email = ?`,
    [JSON.stringify(backupCodes), session.user.email]
  );

  await logUserActivity(record.id, 'security', 'Tạo lại backup codes 2FA', req).catch(() => {});

  return NextResponse.json({ success: true, backupCodes });
});
