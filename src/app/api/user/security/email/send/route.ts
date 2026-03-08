import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/mailer';
import { getSiteSettings } from '@/lib/siteSettings';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const POST = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const db = getDb();

  const rate = await checkRateLimit({
    scope: 'email-verify',
    key: session.user.email,
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000,
    banSeconds: 10 * 60,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau', retryAfter: rate.retryAfter },
      { status: 429, headers: rate.retryAfter ? { 'Retry-After': String(rate.retryAfter) } : {} }
    );
  }

  const [rows] = await db.query<any[]>(
    `SELECT id, email_verified AS verified, email_verification_expires AS exp
     FROM users WHERE email = ? LIMIT 1`,
    [session.user.email]
  );
  const row = rows?.[0];
  if (Boolean(row?.verified)) {
    return NextResponse.json({ success: true, message: 'Email đã được xác minh' });
  }

  // Cooldown 60s between sends (derived from expiry timestamp)
  const exp = row?.exp ? new Date(row.exp).getTime() : 0;
  if (exp) {
    const lastSent = exp - 10 * 60 * 1000;
    const elapsed = Date.now() - lastSent;
    if (elapsed >= 0 && elapsed < 60_000) {
      const retryAfter = Math.ceil((60_000 - elapsed) / 1000);
      return NextResponse.json(
        { success: false, error: 'Bạn vừa yêu cầu mã, hãy đợi một chút rồi thử lại', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }
  }

  const code = generateCode();
  await db.query(
    `UPDATE users
     SET email_verification_code = ?, email_verification_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
     WHERE email = ?`,
    [code, session.user.email]
  );

  const settings = await getSiteSettings();
  const subject = `[${settings.siteName || 'ScamGuard'}] Mã xác minh email`;
  const text = `Mã xác minh email của bạn là: ${code}\n\nMã có hiệu lực trong 10 phút.\nNếu bạn không yêu cầu, hãy bỏ qua email này.\n`;
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; line-height: 1.5;">
      <h2 style="margin:0 0 12px 0;">Xác minh email</h2>
      <p>Mã xác minh của bạn là:</p>
      <div style="font-size:24px; letter-spacing:4px; font-weight:700; padding:12px 16px; border:1px solid #e5e7eb; border-radius:12px; display:inline-block;">
        ${code}
      </div>
      <p style="margin-top:12px;">Mã có hiệu lực trong <b>10 phút</b>.</p>
      <p style="color:#6b7280;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    </div>
  `;

  const sent = await sendEmail({ to: session.user.email, subject, text, html });
  if (!sent.ok) {
    const isConfigError = /smtp|encryption key/i.test(sent.error);
    const publicMessage = isConfigError
      ? 'Hệ thống chưa cấu hình gửi email. Vui lòng liên hệ quản trị viên.'
      : 'Không thể gửi email xác minh. Vui lòng thử lại sau.';
    const message = process.env.NODE_ENV === 'production' ? publicMessage : sent.error;
    return NextResponse.json({ success: false, error: message }, { status: isConfigError ? 400 : 500 });
  }

  if (row?.id) {
    await db
      .query(
        `INSERT INTO user_activity (id, userId, type, description, createdAt) VALUES (?, ?, 'security', ?, NOW())`,
        [crypto.randomUUID(), row.id, 'Yêu cầu mã xác minh email']
      )
      .catch(() => {});
  }

  const payload: any = { success: true, message: 'Đã gửi mã xác minh email' };
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_EMAIL_CODE === '1') {
    payload.devCode = code;
  }
  return NextResponse.json(payload);
});
