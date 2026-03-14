import { NextRequest, NextResponse } from 'next/server';
import { getDb } from './db';
import { AUTH_CONFIG } from './auth';

export const DEVICE_COOKIE = 'device_id';

export function getDeviceId(req: NextRequest): string | null {
  const raw = req.cookies.get(DEVICE_COOKIE)?.value;
  return raw && raw.length > 10 ? raw : null;
}

export async function assertActiveDevice(req: NextRequest, userId: string) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return { allowed: true, deviceId: null };
  }

  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT revokedAt FROM user_devices WHERE userId = ? AND deviceId = ? LIMIT 1`,
    [userId, deviceId]
  );

  const revokedAt = rows?.[0]?.revokedAt;
  if (revokedAt) {
    const response = NextResponse.json(
      { success: false, error: 'Thiết bị đã bị thu hồi' },
      { status: 401 }
    );
    response.cookies.set('next-auth.session-token', '', { maxAge: 0, path: '/' });
    response.cookies.set(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
    response.cookies.set(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
    response.cookies.set(DEVICE_COOKIE, '', { maxAge: 0, path: '/' });
    return { allowed: false, deviceId, response };
  }

  return { allowed: true, deviceId };
}
