import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getUser(email: string) {
  const db = getDb();
  await ensureUserInfra();
  const [rows] = await db.query<any[]>(
    `SELECT id, email, name, image AS avatar, role, created_at AS createdAt, securityScore
     FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows?.[0] || null;
}

export const GET = withApiObservability(async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(email.toLowerCase());
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      avatar: user.avatar,
      securityScore: user.securityScore ?? 72,
    },
  });
});

export const PATCH = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: { name?: string; avatar?: string | null } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : undefined;
  const avatar = typeof body.avatar === 'string' ? body.avatar.trim().slice(0, 500) : null;

  if (!name && body.avatar === undefined) {
    return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
  }

  const db = getDb();
  await ensureUserInfra();
  await db.query(
    `UPDATE users SET name = COALESCE(?, name), image = ? , updated_at = NOW() WHERE email = ? LIMIT 1`,
    [name, avatar, email.toLowerCase()]
  );

  const updated = await getUser(email.toLowerCase());
  return NextResponse.json({ success: true, user: updated });
});

