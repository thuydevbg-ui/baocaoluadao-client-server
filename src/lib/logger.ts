import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true },
        },
});

export function getLogger(meta: Record<string, unknown> = {}) {
  return logger.child(meta);
}

export function logDuration(metric: string, durationMs: number, meta: Record<string, unknown> = {}) {
  logger.info({ metric, durationMs, ...meta }, 'metric');
}
