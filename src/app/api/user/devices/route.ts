import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { DEVICE_COOKIE, assertActiveDevice, getDeviceId } from '@/lib/deviceSession';

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim();
  return req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'unknown';
}

function parseUserAgent(userAgent: string | null) {
  const ua = (userAgent || '').toLowerCase();
  const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
  const isTablet = ua.includes('ipad') || ua.includes('tablet');
  const type = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  const browser = ua.includes('edg') ? 'Edge' : ua.includes('chrome') ? 'Chrome' : ua.includes('firefox') ? 'Firefox' : ua.includes('safari') ? 'Safari' : 'Trình duyệt';
  const os = ua.includes('windows') ? 'Windows' : ua.includes('mac os x') ? 'Mac' : ua.includes('android') ? 'Android' : ua.includes('iphone') || ua.includes('ipad') ? 'iOS' : ua.includes('linux') ? 'Linux' : 'Thiết bị';
  return { type, browser, os };
}

async function getUserId(email: string) {
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  return rows?.[0]?.id || null;
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

  const userAgent = req.headers.get('user-agent');
  const ip = getClientIp(req);
  const uaParsed = parseUserAgent(userAgent);
  const existingDeviceId = getDeviceId(req);
  const deviceId = existingDeviceId || crypto.randomUUID();
  const deviceHash = crypto.createHash('sha256').update(`${userAgent || ''}|${ip}`).digest('hex');
  const name = `${uaParsed.browser} - ${uaParsed.os}`;

  const db = getDb();
  await db.query(
    `INSERT INTO user_devices (id, userId, deviceId, deviceHash, name, type, browser, ip, userAgent, lastActiveAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       deviceId = VALUES(deviceId),
       name = VALUES(name),
       type = VALUES(type),
       browser = VALUES(browser),
       ip = VALUES(ip),
       userAgent = VALUES(userAgent),
       lastActiveAt = NOW()`,
    [crypto.randomUUID(), userId, deviceId, deviceHash, name, uaParsed.type, uaParsed.browser, ip, userAgent || '']
  );

  const [rows] = await db.query<any[]>(
    `SELECT deviceId, deviceHash, name, type, browser, ip, lastActiveAt
     FROM user_devices
     WHERE userId = ? AND revokedAt IS NULL AND deviceId IS NOT NULL
     ORDER BY lastActiveAt DESC`,
    [userId]
  );

  const devices = (rows || []).map((row) => ({
    id: row.deviceId,
    name: row.name,
    type: row.type,
    browser: row.browser,
    ip: row.ip,
    lastActiveAt: row.lastActiveAt,
    current: row.deviceId === deviceId,
  }));
  const response = NextResponse.json({ success: true, devices });
  if (!existingDeviceId) {
    response.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
});
