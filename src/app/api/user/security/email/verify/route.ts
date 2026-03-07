import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const POST = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: { code?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }
  const code = (body.code || '').trim();
  if (!code) return NextResponse.json({ success: false, error: 'Thiếu mã xác minh' }, { status: 400 });

  await ensureUserInfra();
  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT email_verification_code AS code, email_verification_expires AS exp FROM users WHERE email = ? LIMIT 1`,
    [session.user.email]
  );
  const user = rows?.[0];
  if (!user?.code) return NextResponse.json({ success: false, error: 'Chưa yêu cầu mã xác minh' }, { status: 400 });

  const expired = user.exp && new Date(user.exp).getTime() < Date.now();
  if (expired) return NextResponse.json({ success: false, error: 'Mã đã hết hạn, hãy gửi lại' }, { status: 400 });
  if (user.code !== code) return NextResponse.json({ success: false, error: 'Mã không đúng' }, { status: 400 });

  await db.query(
    `UPDATE users SET email_verified = 1, email_verification_code = NULL, email_verification_expires = NULL WHERE email = ?`,
    [session.user.email]
  );

  return NextResponse.json({ success: true, message: 'Xác minh email thành công' });
});
