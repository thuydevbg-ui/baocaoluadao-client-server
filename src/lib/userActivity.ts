import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { getDb } from './db';

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'unknown';
}

export function getDeviceLabel(userAgent: string | null) {
  const ua = (userAgent || '').toLowerCase();
  const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
  const isTablet = ua.includes('ipad') || ua.includes('tablet');
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  const browser = ua.includes('edg')
    ? 'Edge'
    : ua.includes('chrome')
    ? 'Chrome'
    : ua.includes('firefox')
    ? 'Firefox'
    : ua.includes('safari')
    ? 'Safari'
    : 'Trình duyệt';
  const os = ua.includes('windows')
    ? 'Windows'
    : ua.includes('mac os x')
    ? 'Mac'
    : ua.includes('android')
    ? 'Android'
    : ua.includes('iphone') || ua.includes('ipad')
    ? 'iOS'
    : ua.includes('linux')
    ? 'Linux'
    : 'Thiết bị';
  return { deviceType, label: `${browser} - ${os}` };
}

export async function logUserActivity(
  userId: string,
  type: string,
  description: string,
  req?: NextRequest
) {
  const db = getDb();
  const id = crypto.randomUUID();
  const userAgent = req?.headers.get('user-agent') || null;
  const deviceLabel = req ? getDeviceLabel(userAgent).label : null;
  const ip = req ? getClientIp(req) : null;

  await db.query(
    `INSERT INTO user_activity (id, userId, type, description, device, ip, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [id, userId, type.slice(0, 50), description.slice(0, 500), deviceLabel, ip]
  );
}
