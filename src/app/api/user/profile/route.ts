import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
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
  let avatar: string | null = null;
  if (typeof body.avatar === 'string' && body.avatar.trim()) {
    const raw = body.avatar.trim();
    if (raw.startsWith('data:image/')) {
      const matches = raw.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);
      if (matches) {
        const ext = matches[2] === 'jpeg' ? 'jpg' : matches[2];
        const buffer = Buffer.from(matches[3], 'base64');
        const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads', 'avatars');
        await fs.mkdir(uploadsDir, { recursive: true });
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const target = path.join(uploadsDir, fileName);
        await fs.writeFile(target, buffer);
        avatar = `/uploads/avatars/${fileName}`;
      }
    } else if (raw.startsWith('http://') || raw.startsWith('https://')) {
      avatar = raw;
    }
  }

  if (!name && body.avatar === undefined) {
    return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
  }

  const db = getDb();
  await ensureUserInfra();
  await db.query(
    `UPDATE users SET name = COALESCE(?, name), image = COALESCE(?, image), updated_at = NOW() WHERE email = ? LIMIT 1`,
    [name, avatar, email.toLowerCase()]
  );

  const updated = await getUser(email.toLowerCase());
  return NextResponse.json({ success: true, user: updated });
});
