import bcrypt from 'bcrypt';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import TwitterProvider from 'next-auth/providers/twitter';
import { getSiteSettings } from './siteSettings';
import { findUserByEmail, updateUserLoginMeta, upsertOAuthUser, markOAuthLink } from './userRepository';

const googleEnvReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const facebookEnvReady = Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
const twitterEnvReady = Boolean(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_COOKIE_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'ban@example.com' },
        password: { label: 'M?t kh?u', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const settings = await getSiteSettings();
        if (!settings.loginEnabled) return null;

        const user = await findUserByEmail(credentials.email);
        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        await updateUserLoginMeta(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image || undefined,
          role: user.role,
          provider: user.provider,
        };
      },
    }),
    ...(googleEnvReady
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            profile(profile) {
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
    async signIn({ user, account }) {
      const settings = await getSiteSettings();
      if (!settings.loginEnabled) return false;

      if (account?.provider === 'google') {
        if (!settings.googleAuthEnabled || !settings.googleClientId || !settings.googleClientSecret) {
          return false;
        }
      }

      if (account?.provider && user.email) {
        const provider = account.provider as 'google' | 'facebook' | 'twitter';
        await upsertOAuthUser({
          email: user.email,
          name: user.name,
          image: user.image,
          provider,
          providerAccountId: account.providerAccountId ?? account.id ?? null,
        });
        await markOAuthLink(user.email, provider, true);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id || token.id;
        token.role = (user as any).role || token.role || 'user';
      }

      if (!token.id && token.email) {
        const dbUser = await findUserByEmail(token.email);
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.picture = dbUser.image || token.picture;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.role = (token.role as string) || 'user';
        session.user.image = (token.picture as string | null | undefined) ?? session.user.image;
      }
      return session;
    },
  },
};
