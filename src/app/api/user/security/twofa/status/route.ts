import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateURI } from 'otplib';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApiObservability(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT twofa_enabled AS enabled, twofa_secret AS secret, twofa_backup_codes AS backups
     FROM users WHERE email = ? LIMIT 1`,
    [session.user.email]
  );
  const row = rows?.[0] || {};
  let backupCodes: string[] = [];
  if (row.backups) {
    try {
      const parsed = JSON.parse(row.backups);
      backupCodes = Array.isArray(parsed) ? parsed : [];
    } catch {
      backupCodes = [];
    }
  }

  const hasPendingSetup = !row.enabled && row.secret;

  return NextResponse.json({
    success: true,
    data: {
      enabled: Boolean(row.enabled),
      hasPendingSetup,
      // Hiển thị QR & backup codes cả khi đang bật để hỗ trợ đổi thiết bị
      backupCodes: row.secret ? backupCodes : [],
      secret: row.secret || undefined,
      otpauthUrl: row.secret ? generateURI({ issuer: 'ScamGuard', label: session.user.email, secret: row.secret }) : undefined,
    },
  });
});
