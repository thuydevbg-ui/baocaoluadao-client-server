import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApiObservability(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  await ensureUserInfra();
  const [userRows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [session.user.email]);
  const userId = userRows?.[0]?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  const [rows] = await db.query<any[]>(
    `SELECT id, type, description, createdAt FROM user_activity WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`,
    [userId]
  );

  return NextResponse.json({ success: true, items: rows || [] });
});

export const POST = withApiObservability(async (req) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  await ensureUserInfra();
  const [userRows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [session.user.email]);
  const userId = userRows?.[0]?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  let body: { type?: string; description?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const type = (body.type || 'event').slice(0, 50);
  const description = (body.description || '').slice(0, 500);
  if (!description) return NextResponse.json({ success: false, error: 'Description required' }, { status: 400 });

  await db.query(
    `INSERT INTO user_activity (id, userId, type, description, createdAt) VALUES (?, ?, ?, ?, NOW())`,
    [crypto.randomUUID(), userId, type, description]
  );

  return NextResponse.json({ success: true });
});

