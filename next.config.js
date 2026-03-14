/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allowed origins for development (comma-separated list)
  // In production, only the actual domain should be allowed
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS 
    ? process.env.ALLOWED_DEV_ORIGINS.split(',').map(o => o.trim())
    : ['localhost', 'localhost:3000', '127.0.0.1', '127.0.0.1:3000'],
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
  async headers() {
    return [
      {
        // Force HTML responses to be uncached so UI/code changes take effect immediately
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
        ],
      },
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
      // Content Security Policy - Allow Google Fonts and Cloudflare Insights
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com https://static.cloudflareinsights.com https://static.cloudinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn-uicons.flaticon.com; font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn-uicons.flaticon.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.google-analytics.com https://*.googletagmanager.com ws: wss:; frame-src 'self' https://www.google.com;",
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

  // Fix server chunk lookup: ensure server chunks are emitted next to the runtime
  // instead of under the default "chunks/" subfolder (the runtime currently resolves
  // chunks with a relative path like "./<id>.js").
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.output.chunkFilename = '[name].js';
      config.output.hotUpdateChunkFilename = '[id].hot-update.js';
    }
    return config;
  },
}

module.exports = nextConfig
