/**
 * Next.js Instrumentation Hook — Route Warmup
 *
 * Runs once on server start. Sends a warmup HTTP request to the auth session
 * endpoint so that Next.js compiles the route in the background. This way,
 * the first real user request is instant instead of waiting 15-30 seconds.
 *
 * In Next.js 15, this file is auto-detected — no extra config needed.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    setTimeout(async () => {
      // Determine base URL. NEXTAUTH_URL is the most reliable source,
      // as it must be set to the actual server URL for next-auth to work.
      const baseUrl = resolveBaseUrl();
      try {
        const res = await fetch(`${baseUrl}/api/auth/session`, {
          headers: { 'x-warmup': '1' },
          // Do not follow redirects — we just need to trigger compilation
          redirect: 'manual',
        });
        console.log(`[warmup] /api/auth/session → HTTP ${res.status} at ${baseUrl} (route pre-compiled)`);
      } catch (err) {
        // Non-critical; the user will just experience the first-request delay
        console.log(`[warmup] /api/auth/session failed at ${baseUrl}:`, err instanceof Error ? err.message : err);
      }
    }, 4000); // Allow 4s for server to fully initialize before warming up
  }
}

function resolveBaseUrl(): string {
  const port = process.env.PORT ?? '3000';
  const localBase = `http://localhost:${port}`;

  // In development, always use localhost — NEXTAUTH_URL may point to the production domain
  if (process.env.NODE_ENV !== 'production') {
    return localBase;
  }

  // In production, NEXTAUTH_URL is the most reliable source
  if (process.env.NEXTAUTH_URL) {
    try {
      return new URL(process.env.NEXTAUTH_URL).origin;
    } catch {
      // Fall through
    }
  }

  return localBase;
}
