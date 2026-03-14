import bcrypt from 'bcrypt';
import type { NextAuthOptions, RequestInternal } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import TwitterProvider from 'next-auth/providers/twitter';
import { getSiteSettings } from './siteSettings';
import { findUserByEmail, updateUserLoginMeta, upsertOAuthUser, markOAuthLink } from './userRepository';
import { env, ensureRequiredEnv } from './env';
import { logger } from './logger';

// OAuth providers are conditionally enabled based on environment variables
const googleEnvReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const facebookEnvReady = Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
const twitterEnvReady = Boolean(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET);

ensureRequiredEnv();

const canonicalUrl = env.NEXT_PUBLIC_SITE_URL || env.NEXTAUTH_URL;
if (!canonicalUrl) {
  throw new Error('NEXT_PUBLIC_SITE_URL or NEXTAUTH_URL must be provided for NextAuth redirects');
}

let canonicalOrigin: string;
try {
  canonicalOrigin = new URL(canonicalUrl).origin;
} catch (error) {
  throw new Error(`Invalid canonical URL provided for NextAuth: ${canonicalUrl}`);
}

const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Cleanup every 5 minutes

// Periodic cleanup to prevent memory leak from stale rate limit entries
function startRateLimitCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

// Start cleanup timer (will run for the lifetime of the server)
if (process.env.NODE_ENV !== 'test') {
  startRateLimitCleanup();
}

function getRateLimitKey(email: string, ip: string) {
  return `${email}:${ip}`;
}

function isRateLimited(key: string) {
  const entry = rateLimitMap.get(key);
  if (!entry) return false;
  const elapsed = Date.now() - entry.firstAttempt;
  if (elapsed > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.delete(key);
    return false;
  }
  return entry.count >= RATE_LIMIT_MAX;
}

function recordAttempt(key: string, success: boolean) {
  if (success) {
    rateLimitMap.delete(key);
    return;
  }
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now });
    return;
  }
  rateLimitMap.set(key, { count: entry.count + 1, firstAttempt: entry.firstAttempt });
}

export const authOptions: NextAuthOptions = {
    session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60, updateAge: 5 * 60 },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_COOKIE_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'ban@example.com' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials, req: Pick<RequestInternal, 'method' | 'headers' | 'body' | 'query'>) {
        if (!credentials?.email || !credentials.password) return null;

        const r = req as any;
        const clientIp =
          ((r?.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()) ||
          (r?.socket?.remoteAddress as string | undefined) ||
          'unknown';
        const limiterKey = getRateLimitKey(credentials.email.toLowerCase(), clientIp);
        if (isRateLimited(limiterKey)) {
          logger.warn({ limiterKey, clientIp }, 'Rate limit exceeded for login attempt');
          return null;
        }

        const settings = await getSiteSettings();
        if (!settings.loginEnabled) return null;

        const user = await findUserByEmail(credentials.email);
        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          recordAttempt(limiterKey, false);
          return null;
        }

        recordAttempt(limiterKey, true);
        await updateUserLoginMeta(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image || undefined,
          role: user.role,
          provider: user.provider,
          createdAt: user.createdAt,
        };
      },
    }),
    ...(googleEnvReady
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            profile(profile: any) {
              return {
                id: profile.sub,
                name: profile.name || profile.given_name || profile.email,
                email: profile.email,
                image: profile.picture || null,
              };
            },
          }),
        ]
      : []),
    ...(facebookEnvReady
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(twitterEnvReady
      ? [
          TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID!,
            clientSecret: process.env.TWITTER_CLIENT_SECRET!,
            version: '2.0',
          }),
        ]
      : []),
  ],
  callbacks: {
    async redirect({ url }) {
      const baseOrigin = canonicalOrigin;
      if (url.startsWith('/')) return `${baseOrigin}${url}`;
      try {
        const target = new URL(url);
        if (target.origin === baseOrigin) return target.toString();
      } catch {
        // fall back to base origin if URL parse fails
      }
      return baseOrigin;
    },
    async signIn({ user, account }) {
      const settings = await getSiteSettings();
      if (!settings.loginEnabled) return false;

      if (account?.provider === 'google') {
        if (!settings.googleAuthEnabled || !settings.googleClientId || !settings.googleClientSecret) {
          return false;
        }
      }
      if (account?.provider === 'facebook') {
        if (!settings.facebookAuthEnabled || !settings.facebookClientId || !settings.facebookClientSecret) {
          return false;
        }
      }
      if (account?.provider === 'twitter') {
        if (!settings.twitterAuthEnabled || !settings.twitterClientId || !settings.twitterClientSecret) {
          return false;
        }
      }

      if (
        user.email &&
        account &&
        (account.provider === 'google' || account.provider === 'facebook' || account.provider === 'twitter')
      ) {
        const provider = account.provider;
        await upsertOAuthUser({
          email: user.email,
          name: user.name,
          image: user.image,
          provider,
          providerAccountId: account.providerAccountId ?? null,
        });
        await markOAuthLink(user.email, provider, true);
      }
      return true;
    },
    async jwt({ token, user }) {
      // Store user info in token on initial login/signup
      if (user) {
        token.id = (user as any).id || token.id;
        token.role = (user as any).role || token.role || 'user';
        token.picture = (user as any).image || token.picture;
        token.createdAt = (user as any).createdAt || token.createdAt;
      }

      // Only query DB if token doesn't have required info (fallback for legacy tokens)
      // This should rarely happen after first login since token is persisted
      if (!token.id && token.email) {
        console.warn('[Auth] JWT token missing id, fetching from DB for:', token.email);
        const dbUser = await findUserByEmail(token.email);
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.picture = dbUser.image || token.picture;
          token.createdAt = dbUser.createdAt;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.role = (token.role as string) || 'user';
        session.user.image = (token.picture as string | null | undefined) ?? session.user.image;
        session.user.createdAt = (token.createdAt as string) || null;
      }
      return session;
    },
  },
};
