export interface SentryContext {
  requestId?: string;
  path?: string;
  method?: string;
  status?: number;
  extras?: Record<string, unknown>;
}

export function captureException(error: unknown, context: SentryContext = {}) {
  // Lazy-load Sentry to avoid heavy OpenTelemetry dependency being bundled
  // on every route during Next.js dev-mode cold compilation.
  // In production, Sentry is enabled and this dynamic import resolves instantly
  // from the already-loaded module cache.
  import('@sentry/nextjs')
    .then(({ withScope, captureException: sentryCapture }) => {
      const wrappedError =
        error instanceof Error
          ? error
          : new Error(typeof error === 'string' ? error : 'Non-error exception');

      withScope((scope) => {
        if (context.requestId) scope.setTag('request_id', context.requestId);
        if (context.path) scope.setTag('path', context.path);
        if (context.method) scope.setTag('method', context.method);
        if (context.status) scope.setTag('status_code', String(context.status));
        if (context.extras) scope.setExtras(context.extras);
        scope.setLevel('error');
        sentryCapture(wrappedError);
      });
    })
    .catch((err) => {
      // Log to console instead of silently ignoring - we need to know if Sentry fails
      console.error('[Sentry] Failed to capture exception:', err instanceof Error ? err.message : err);
    });
}
