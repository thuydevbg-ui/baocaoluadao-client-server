const requiredEnv: Record<string, string> = {
  NEXTAUTH_URL: 'Canonical server URL (used by NextAuth callbacks)',
  NEXT_PUBLIC_SITE_URL: 'Public site URL (used by clients and redirect safety)',
  NEXTAUTH_SECRET: 'NextAuth secret for token signing',
  AUTH_COOKIE_SECRET: 'Legacy session cookie secret',
  DB_HOST: 'Primary database host',
  DB_USER: 'Primary database user',
  DB_PASSWORD: 'Primary database password',
  DB_NAME: 'Primary database name',
};

export function getEnv(name: keyof typeof requiredEnv) {
  const value = process.env[name];
  if (!value) {
    console.warn(`[env] Missing required env var ${name}: ${requiredEnv[name]}`);
  }
  return value || '';
}

export const env = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  AUTH_COOKIE_SECRET: process.env.AUTH_COOKIE_SECRET || '',
  DB_MANAGER_KEY: process.env.DB_MANAGER_KEY || '',
};

export function ensureRequiredEnv() {
  Object.keys(requiredEnv).forEach((key) => {
    if (!process.env[key]) {
      console.warn(`[env] Required env ${key} is not set (${requiredEnv[key]})`);
    }
  });
}
