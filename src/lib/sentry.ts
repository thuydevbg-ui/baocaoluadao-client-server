import * as Sentry from '@sentry/nextjs';

export interface SentryContext {
  requestId?: string;
  path?: string;
  method?: string;
  status?: number;
  extras?: Record<string, unknown>;
}

export function captureException(error: unknown, context: SentryContext = {}) {
  const wrappedError = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Non-error exception');

  Sentry.withScope((scope) => {
    if (context.requestId) {
      scope.setTag('request_id', context.requestId);
    }
    if (context.path) {
      scope.setTag('path', context.path);
    }
    if (context.method) {
      scope.setTag('method', context.method);
    }
    if (context.status) {
      scope.setTag('status_code', String(context.status));
    }
    if (context.extras) {
      scope.setExtras(context.extras);
    }
    scope.setLevel('error');
    Sentry.captureException(wrappedError);
  });
}
