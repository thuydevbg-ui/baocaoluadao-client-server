import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { assertActiveDevice } from '@/lib/deviceSession';
import { logUserActivity } from '@/lib/userActivity';

export const dynamic = 'force-dynamic';

async function getUserId(email: string) {
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  return rows?.[0]?.id || null;
}

async function getPreferences(userId: string) {
  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT language, timezone, theme FROM user_preferences WHERE userId = ? LIMIT 1`,
    [userId]
  );
  if (rows?.[0]) return rows[0];
  await db.query(`INSERT IGNORE INTO user_preferences (userId) VALUES (?)`, [userId]);
  return { language: 'vi', timezone: 'Asia/Ho_Chi_Minh', theme: 'system' };
}

export const GET = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const deviceCheck = await assertActiveDevice(req, userId);
  if (!deviceCheck.allowed) return deviceCheck.response!;

  const preferences = await getPreferences(userId);
  return NextResponse.json({ success: true, preferences });
});

export const PATCH = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: { language?: string; timezone?: string; theme?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const deviceCheck = await assertActiveDevice(req, userId);
  if (!deviceCheck.allowed) return deviceCheck.response!;

  const language = typeof body.language === 'string' && body.language.trim() ? body.language.trim().slice(0, 10) : null;
  const timezone = typeof body.timezone === 'string' && body.timezone.trim() ? body.timezone.trim().slice(0, 50) : null;
  const theme = typeof body.theme === 'string' && ['light', 'dark', 'system'].includes(body.theme)
    ? body.theme
    : null;

  if (!language && !timezone && !theme) {
    return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
  }

  const db = getDb();
  await db.query(
    `INSERT INTO user_preferences (userId, language, timezone, theme, updatedAt)
     VALUES (?, COALESCE(?, 'vi'), COALESCE(?, 'Asia/Ho_Chi_Minh'), COALESCE(?, 'system'), NOW())
     ON DUPLICATE KEY UPDATE
       language = COALESCE(?, language),
       timezone = COALESCE(?, timezone),
       theme = COALESCE(?, theme),
       updatedAt = NOW()`,
    [userId, language, timezone, theme, language, timezone, theme]
  );

  const preferences = await getPreferences(userId);
  const changedFields: string[] = [];
  if (language) changedFields.push('ngôn ngữ');
  if (timezone) changedFields.push('múi giờ');
  if (theme) changedFields.push('giao diện');
  if (changedFields.length) {
    await logUserActivity(userId, 'settings', `Cập nhật ${changedFields.join(', ')}`, req).catch(() => {});
  }
  return NextResponse.json({ success: true, preferences });
});
