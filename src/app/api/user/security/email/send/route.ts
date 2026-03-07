import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const POST = withApiObservability(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const db = getDb();
  const code = generateCode();
  await db.query(
    `UPDATE users SET email_verification_code = ?, email_verification_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?`,
    [code, session.user.email]
  );

  // In production you would send email here. For now, return code for QA visibility.
  console.log('Email verification code', code, 'for user', session.user.email);

  return NextResponse.json({ success: true, message: 'Đã gửi mã xác minh email', devCode: code });
});
