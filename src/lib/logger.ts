import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

const baseLogger = pino({
  level: logLevel,
  base: {
    service: 'baocaoluadao',
    version: process.env.npm_package_version || 'unknown',
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export type LoggerContext = pino.Bindings & { requestId?: string };

export function getLogger(context?: LoggerContext) {
  if (context) {
    const { requestId, ...rest } = context;
    return baseLogger.child({ ...rest, requestId });
  }
  return baseLogger;
}

export function logDuration(label: string, durationMs: number, context?: LoggerContext) {
  const log = getLogger(context);
  const entry = {
    label,
    durationMs,
  };
  if (durationMs > 300) {
    log.warn(entry, `${label} took ${durationMs}ms`);
  } else {
    log.info(entry, `${label} completed`);
  }
}

export const logger = baseLogger;
