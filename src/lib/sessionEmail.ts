import type { NextRequest } from 'next/server';

/**
 * Get session email from request.
 * In development/test mode, allows impersonation via x-test-user-email header.
 * NEVER enable test impersonation in production!
 */
export async function getSessionEmail(req?: NextRequest): Promise<string | null> {
  // Test impersonation is ONLY allowed in development mode, NEVER in production
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  
  // SECURITY: Explicitly disable test impersonation in production
  if (process.env.NODE_ENV === 'production') {
    // In production, always use real session - no impersonation allowed
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('./nextAuthOptions');
    const session = await getServerSession(authOptions);
    return session?.user?.email ?? null;
  }
  
  const canImpersonate = isDevOrTest && process.env.ALLOW_TEST_IMPERSONATION === '1';
  const headerEmail = req?.headers?.get('x-test-user-email') || undefined;
  if (canImpersonate && headerEmail) return headerEmail;

  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('./nextAuthOptions');
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}
