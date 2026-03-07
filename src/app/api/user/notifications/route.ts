import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getSettings(userId: string) {
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT emailAlerts, pushAlerts, weeklySummary FROM notifications_settings WHERE userId = ? LIMIT 1`, [userId]);
  if (rows?.[0]) return rows[0];
  await db.query(`INSERT IGNORE INTO notifications_settings (userId) VALUES (?)`, [userId]);
  return { emailAlerts: 1, pushAlerts: 0, weeklySummary: 1 };
}

export const GET = withApiObservability(async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  await ensureUserInfra();
  const db = getDb();
  const [userRows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  const userId = userRows?.[0]?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const settings = await getSettings(userId);
  return NextResponse.json({ success: true, settings });
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

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

  const emailAlerts = body.emailAlerts ? 1 : 0;
  const pushAlerts = body.pushAlerts ? 1 : 0;
  const weeklySummary = body.weeklySummary ? 1 : 0;

  await db.query(
    `INSERT INTO notifications_settings (userId, emailAlerts, pushAlerts, weeklySummary, updatedAt)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE emailAlerts=VALUES(emailAlerts), pushAlerts=VALUES(pushAlerts), weeklySummary=VALUES(weeklySummary), updatedAt=NOW()`,
    [userId, emailAlerts, pushAlerts, weeklySummary]
  );

  return NextResponse.json({ success: true, settings: { emailAlerts, pushAlerts, weeklySummary } });
});

