import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: '',
  enabled: false,
  tracesSampleRate: 0,
  beforeSend(_event) {
    return null;
  },
});
