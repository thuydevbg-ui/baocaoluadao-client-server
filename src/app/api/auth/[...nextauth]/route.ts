import NextAuth from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';

// NextAuth relies on Node APIs and must always be handled dynamically.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// NOTE: We intentionally do NOT wrap this route with withApiObservability (which imports
// @sentry/nextjs → @opentelemetry chain). That heavy dependency caused 25-32 second
// cold-start time in dev mode. The auth route has its own security & logging built into NextAuth.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
