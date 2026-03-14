import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { assertActiveDevice } from '@/lib/deviceSession';
import { getClientIp, getDeviceLabel, logUserActivity } from '@/lib/userActivity';

export const dynamic = 'force-dynamic';

export const GET = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  await ensureUserInfra();
  const [userRows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [session.user.email]);
  const userId = userRows?.[0]?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const deviceCheck = await assertActiveDevice(req, userId);
  if (!deviceCheck.allowed) return deviceCheck.response!;

  const [rows] = await db.query<any[]>(
    `SELECT id, type, description, device, ip, createdAt FROM user_activity WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`,
    [userId]
  );

  return NextResponse.json({ success: true, items: rows || [] });
});

export const POST = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  await ensureUserInfra();
  const [userRows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [session.user.email]);
  const userId = userRows?.[0]?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const deviceCheck = await assertActiveDevice(req, userId);
  if (!deviceCheck.allowed) return deviceCheck.response!;

  let body: { type?: string; description?: string; device?: string; ip?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const type = (body.type || 'event').slice(0, 50);
  const description = (body.description || '').slice(0, 500);
  if (!description) return NextResponse.json({ success: false, error: 'Description required' }, { status: 400 });
  const userAgent = req.headers.get('user-agent');
  if (body.device || body.ip) {
    const deviceMeta = getDeviceLabel(userAgent);
    const device = (body.device || deviceMeta.label).slice(0, 120);
    const ip = (body.ip || getClientIp(req)).slice(0, 60);
    await db.query(
      `INSERT INTO user_activity (id, userId, type, description, device, ip, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [crypto.randomUUID(), userId, type, description, device, ip]
    );
  } else {
    await logUserActivity(userId, type, description, req);
  }

  return NextResponse.json({ success: true });
});
