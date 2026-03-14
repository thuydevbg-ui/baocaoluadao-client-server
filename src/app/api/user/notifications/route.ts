import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { assertActiveDevice } from '@/lib/deviceSession';
import { logUserActivity } from '@/lib/userActivity';

export const dynamic = 'force-dynamic';

async function getSettings(userId: string) {
  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT emailAlerts, pushAlerts, smsAlerts, reportUpdates, securityAlerts, weeklySummary
     FROM notifications_settings WHERE userId = ? LIMIT 1`,
    [userId]
  );
  if (rows?.[0]) return rows[0];
  await db.query(`INSERT IGNORE INTO notifications_settings (userId) VALUES (?)`, [userId]);
  return { emailAlerts: 1, pushAlerts: 0, smsAlerts: 0, reportUpdates: 1, securityAlerts: 1, weeklySummary: 1 };
}

export const GET = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  await ensureUserInfra();
  const db = getDb();
  const [userRows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  const userId = userRows?.[0]?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const deviceCheck = await assertActiveDevice(req, userId);
  if (!deviceCheck.allowed) return deviceCheck.response!;
  const settings = await getSettings(userId);
  return NextResponse.json({
    success: true,
    settings: {
      email: Boolean(settings.emailAlerts),
      push: Boolean(settings.pushAlerts),
      sms: Boolean(settings.smsAlerts),
      reportUpdates: Boolean(settings.reportUpdates),
      weeklyDigest: Boolean(settings.weeklySummary),
      securityAlerts: Boolean(settings.securityAlerts),
      emailAlerts: Boolean(settings.emailAlerts),
      pushAlerts: Boolean(settings.pushAlerts),
      weeklySummary: Boolean(settings.weeklySummary),
    },
  });
});

export const PATCH = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  await ensureUserInfra();
  const db = getDb();
  const [userRows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  const userId = userRows?.[0]?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const deviceCheck = await assertActiveDevice(req, userId);
  if (!deviceCheck.allowed) return deviceCheck.response!;

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

  const emailAlerts = (body.email ?? body.emailAlerts) ? 1 : 0;
  const pushAlerts = (body.push ?? body.pushAlerts) ? 1 : 0;
  const smsAlerts = body.sms ? 1 : 0;
  const reportUpdates = body.reportUpdates ? 1 : 0;
  const securityAlerts = body.securityAlerts ? 1 : 0;
  const weeklySummary = (body.weeklyDigest ?? body.weeklySummary) ? 1 : 0;

  await db.query(
    `INSERT INTO notifications_settings (userId, emailAlerts, pushAlerts, smsAlerts, reportUpdates, securityAlerts, weeklySummary, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       emailAlerts=VALUES(emailAlerts),
       pushAlerts=VALUES(pushAlerts),
       smsAlerts=VALUES(smsAlerts),
       reportUpdates=VALUES(reportUpdates),
       securityAlerts=VALUES(securityAlerts),
       weeklySummary=VALUES(weeklySummary),
       updatedAt=NOW()`,
    [userId, emailAlerts, pushAlerts, smsAlerts, reportUpdates, securityAlerts, weeklySummary]
  );

  await logUserActivity(userId, 'settings', 'Cập nhật cài đặt thông báo', req).catch(() => {});

  return NextResponse.json({
    success: true,
    settings: {
      email: Boolean(emailAlerts),
      push: Boolean(pushAlerts),
      sms: Boolean(smsAlerts),
      reportUpdates: Boolean(reportUpdates),
      weeklyDigest: Boolean(weeklySummary),
      securityAlerts: Boolean(securityAlerts),
      emailAlerts: Boolean(emailAlerts),
      pushAlerts: Boolean(pushAlerts),
      weeklySummary: Boolean(weeklySummary),
    },
  });
});
