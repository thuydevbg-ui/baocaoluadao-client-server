import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuthValidated, requireRole } from '@/lib/adminApiAuth';
import { sendEmail, verifySmtp } from '@/lib/mailer';
import { getSiteSettings } from '@/lib/siteSettings';

export const dynamic = 'force-dynamic';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!requireRole(auth, ['super_admin', 'admin'])) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const to = typeof body?.to === 'string' ? body.to.trim() : '';
  if (!EMAIL_PATTERN.test(to)) {
    return NextResponse.json({ success: false, error: 'Email nhận không hợp lệ' }, { status: 400 });
  }

  const verify = await verifySmtp();
  if (!verify.ok) {
    return NextResponse.json({ success: false, error: verify.error }, { status: 400 });
  }

  const settings = await getSiteSettings();
  const result = await sendEmail({
    to,
    subject: `[${settings.siteName || 'ScamGuard'}] Email test SMTP`,
    text: `Xin chào,\n\nĐây là email test để kiểm tra cấu hình SMTP của hệ thống ScamGuard.\n\nThời gian: ${new Date().toISOString()}\n`,
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Đã gửi email test' });
});

