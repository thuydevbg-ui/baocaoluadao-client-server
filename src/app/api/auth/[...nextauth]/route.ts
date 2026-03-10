import NextAuth from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';
import { NextRequest } from 'next/server';

// NOTE: We intentionally do NOT wrap this route with withApiObservability (which imports
// @sentry/nextjs → @opentelemetry chain). That heavy dependency caused 25-32 second
// cold-start time in dev mode. The auth route has its own security & logging built into NextAuth.
const nextAuthHandler = NextAuth(authOptions);

export async function GET(request: NextRequest, context: unknown) {
  return nextAuthHandler(request, context);
}

export async function POST(request: NextRequest, context: unknown) {
  return nextAuthHandler(request, context);
}
