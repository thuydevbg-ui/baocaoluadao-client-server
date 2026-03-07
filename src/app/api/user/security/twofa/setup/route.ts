import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authenticator } from 'otplib';
import { v4 as uuid } from 'uuid';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

function generateBackupCodes() {
  return Array.from({ length: 6 }, () => uuid().replace(/-/g, '').slice(0, 10));
}

export const POST = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: { password?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  await ensureUserInfra();
  const db = getDb();

  const [rows] = await db.query<any[]>(`SELECT password_hash, twofa_enabled FROM users WHERE email = ? LIMIT 1`, [session.user.email]);
  const record = rows?.[0];
  if (record?.password_hash) {
    const ok = await bcrypt.compare(body.password || '', record.password_hash);
    if (!ok) return NextResponse.json({ success: false, error: 'Mật khẩu xác thực không đúng' }, { status: 400 });
  }

  if (record?.twofa_enabled) {
    return NextResponse.json({ success: false, error: '2FA đang bật' }, { status: 400 });
  }

  const secret = authenticator.generateSecret();
  const backupCodes = generateBackupCodes();
  const otpauthUrl = authenticator.keyuri(session.user.email, 'ScamGuard', secret);

  await db.query(
    `UPDATE users SET twofa_secret = ?, twofa_backup_codes = ?, updated_at = NOW() WHERE email = ?`,
    [secret, JSON.stringify(backupCodes), session.user.email]
  );

  return NextResponse.json({ success: true, secret, otpauthUrl, backupCodes });
});
