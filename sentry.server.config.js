import * as Sentry from '@sentry/nextjs';

const DSN = process.env.SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie'];

function sanitizeHeaders(headers = {}) {
  if (!headers || typeof headers !== 'object') return headers;
  const sanitized: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    sanitized[key] = SENSITIVE_HEADERS.includes(lowerKey) ? '[REDACTED]' : String(value);
  });
  return sanitized;
}

function sanitizePayload(payload: unknown): unknown {
  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map(sanitizePayload);
  }

  if (typeof payload === 'object' && payload !== null) {
    return Object.entries(payload).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (/password/i.test(key)) {
        acc[key] = '[REDACTED]';
      } else {
        acc[key] = sanitizePayload(value);
      }
      return acc;
    }, {});
  }

  return payload;
}

Sentry.init({
  dsn: DSN || '',
  enabled: Boolean(DSN) && isProduction,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.npm_package_version,
  beforeSend(event) {
    if (event.request) {
      if (event.request.headers) {
        event.request.headers = sanitizeHeaders(event.request.headers as Record<string, string>);
      }

      if (event.request.cookies) {
        event.request.cookies = '[REDACTED]';
      }

      if (event.request.data) {
        event.request.data = sanitizePayload(event.request.data);
      }
    }
    return event;
  },
});
