import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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
  const [rows] = await db.query<any[]>(
    `SELECT last_login_at AS recentLogin, password_hash AS passwordSet, image AS avatar, securityScore,
            twofa_enabled AS twofaEnabled, oauth_connected AS oauthConnected, oauth_provider AS oauthProvider,
            email_verified AS emailVerified
     FROM users WHERE email = ? LIMIT 1`,
    [session.user.email]
  );
  const row = rows?.[0];
  const rawOauthProvider = String(row?.oauthProvider || '').toLowerCase();
  const oauthProviderValid = ['google', 'facebook', 'twitter', 'telegram'].includes(rawOauthProvider);
  const oauthConnected = Boolean(row?.oauthConnected) && oauthProviderValid;

  // Auto-heal legacy/invalid state (e.g. oauth_provider='credentials')
  if (row?.oauthConnected && !oauthProviderValid) {
    await db
      .query(`UPDATE users SET oauth_connected = 0, oauth_provider = NULL, updated_at = NOW() WHERE email = ?`, [
        session.user.email,
      ])
      .catch(() => {});
  }

  return NextResponse.json({
    success: true,
    security: {
      passwordSet: Boolean(row?.passwordSet),
      emailVerified: Boolean(row?.emailVerified),
      twoFactorEnabled: Boolean(row?.twofaEnabled),
      oauthConnected,
      oauthProvider: oauthConnected ? rawOauthProvider : null,
      recentLogin: row?.recentLogin || null,
      securityScore: row?.securityScore ?? 72,
    },
  });
});
