/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable Caching
  httpAgentOptions: {
    keepAlive: true,
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  // Cache configuration for static files only
  // Note: Dynamic pages are cached via middleware.ts with shorter cache times
  // IMPORTANT: middleware.ts must have a matcher that includes public routes for caching to work
  headers: async () => {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    domains: ['localhost', 'ui-avatars.com', 'lh3.googleusercontent.com'],
  },
  // Ignore the workers directory - it's a separate Cloudflare Workers project
  // and should not be included in the Next.js build
  ignoreBuildErrors: false,
  // Exclude workers directory from the build
  onDemandEntries: {
    // Make sure pages are not disposed for 60 seconds
    maxInactiveAge: 60000,
    pagesBufferLength: 10,
  },
  // Treat heavy server-only packages as external so Next.js does not bundle them.
  // Previously, @sentry/node + @opentelemetry caused 25-32 second cold-start in dev mode.
  // Marking them as external means Next.js uses require() at runtime instead of bundling.
  serverExternalPackages: [
    '@sentry/node',
    '@opentelemetry/instrumentation',
    '@opentelemetry/api',
    '@opentelemetry/core',
    '@opentelemetry/sdk-node',
    '@opentelemetry/sdk-trace-base',
    'mysql2',
    'bcrypt',
    'pino',
  ],
}

module.exports = nextConfig
