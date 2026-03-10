/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
