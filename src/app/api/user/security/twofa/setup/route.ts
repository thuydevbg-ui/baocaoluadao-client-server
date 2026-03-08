import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { generateSecret, generateURI } from 'otplib';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

function generateBackupCodes() {
  // 6 codes, 12 hex chars each (48 bits) - sufficient for one-time backup use.
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
  if (record?.password_hash) {
    const ok = await bcrypt.compare(body.password || '', record.password_hash);
    if (!ok) return NextResponse.json({ success: false, error: 'Mật khẩu xác thực không đúng' }, { status: 400 });
  }

  if (record?.twofa_enabled) {
    return NextResponse.json({ success: false, error: '2FA đang bật' }, { status: 400 });
  }

  const secret = generateSecret();
  const backupCodes = generateBackupCodes();
  const otpauthUrl = generateURI({ issuer: 'ScamGuard', label: session.user.email, secret });

  await db.query(
    `UPDATE users SET twofa_secret = ?, twofa_backup_codes = ?, updated_at = NOW() WHERE email = ?`,
    [secret, JSON.stringify(backupCodes), session.user.email]
  );

  if (record?.id) {
    await db
      .query(
        `INSERT INTO user_activity (id, userId, type, description, createdAt) VALUES (?, ?, 'security', ?, NOW())`,
        [crypto.randomUUID(), record.id, 'Khởi tạo thiết lập 2FA']
      )
      .catch(() => {});
  }

  return NextResponse.json({ success: true, secret, otpauthUrl, backupCodes });
});
