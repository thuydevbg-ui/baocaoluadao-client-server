import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { assertActiveDevice, getDeviceId } from '@/lib/deviceSession';
import { logUserActivity } from '@/lib/userActivity';
import { AUTH_CONFIG } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getUserId(email: string) {
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  return rows?.[0]?.id || null;
}

export const DELETE = withApiObservability(async (req, apiContext, { params }: { params: Promise<{ id: string }> }) => {
  const { id: deviceId } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const deviceCheck = await assertActiveDevice(req, userId);
  if (!deviceCheck.allowed) return deviceCheck.response!;

  if (!deviceId) return NextResponse.json({ success: false, error: 'Invalid device id' }, { status: 400 });
  if (!deviceId) return NextResponse.json({ success: false, error: 'Invalid device id' }, { status: 400 });

  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT name FROM user_devices WHERE userId = ? AND deviceId = ? LIMIT 1`,
    [userId, deviceId]
  );
  const name = rows?.[0]?.name;
  await db.query(
    `UPDATE user_devices SET revokedAt = NOW(), revokedReason = 'user_revoke' WHERE userId = ? AND deviceId = ?`,
    [userId, deviceId]
  );
  if (name) {
    await logUserActivity(userId, 'security', `Thu hồi thiết bị: ${name}`, req).catch(() => {});
  }

  const currentDeviceId = getDeviceId(req);
  const response = NextResponse.json({ success: true, revoked: deviceId });
  if (currentDeviceId && currentDeviceId === deviceId) {
    response.cookies.set('next-auth.session-token', '', { maxAge: 0, path: '/' });
    response.cookies.set(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
    response.cookies.set(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
    response.cookies.set('device_id', '', { maxAge: 0, path: '/' });
  }

  return response;
});
