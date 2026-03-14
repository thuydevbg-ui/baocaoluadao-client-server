import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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

  let body: { otp?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const token = (body.otp || '').trim();
  if (!token) return NextResponse.json({ success: false, error: 'Thiếu mã xác thực' }, { status: 400 });

  await ensureUserInfra();
  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT id, twofa_enabled, twofa_secret, twofa_backup_codes FROM users WHERE email = ? LIMIT 1`,
    [session.user.email]
  );
  const record = rows?.[0];
  if (!record?.id) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  const deviceCheck = await assertActiveDevice(req, record.id);
  if (!deviceCheck.allowed) return deviceCheck.response!;

  if (!record.twofa_enabled) {
    return NextResponse.json({ success: false, error: '2FA chưa được bật' }, { status: 400 });
  }

  const normalized = token.replace(/[^a-z0-9]/gi, '').toLowerCase();
  let backupCodes: string[] = [];
  try {
    const parsed = JSON.parse(record.twofa_backup_codes || '[]');
    backupCodes = Array.isArray(parsed) ? parsed : [];
  } catch {
    backupCodes = [];
  }
  const normalizedBackup = backupCodes.map((code) => String(code).toLowerCase());
  const backupIndex = normalizedBackup.indexOf(normalized);

  if (backupIndex >= 0) {
    backupCodes.splice(backupIndex, 1);
    await db.query(
      `UPDATE users SET twofa_backup_codes = ?, updated_at = NOW() WHERE email = ?`,
      [JSON.stringify(backupCodes), session.user.email]
    );
  } else {
    if (!record.twofa_secret) {
      return NextResponse.json({ success: false, error: 'Chưa khởi tạo 2FA' }, { status: 400 });
    }
    const result = verifySync({ secret: record.twofa_secret, token: normalized });
    if (!result.valid) {
      return NextResponse.json({ success: false, error: 'Mã 2FA không đúng' }, { status: 400 });
    }
  }

  await logUserActivity(record.id, 'security', 'Xác thực 2FA khi đăng nhập', req).catch(() => {});

  return NextResponse.json({ success: true, verifiedAt: new Date().toISOString() });
});
