import pino from 'pino';
import { createRequire } from 'module';

const isDev = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

// Enable pretty logs in dev only when explicitly requested AND module is available.
let transport: pino.TransportSingleOptions | undefined;
if (isDev && process.env.PINO_PRETTY === '1') {
  try {
    const require = createRequire(import.meta.url);
    // require.resolve avoids bundler trying to include missing optional dependency
    const target = require.resolve('pino-pretty');
    transport = {
      target,
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  } catch (error) {
    // Silent fallback to JSON logs when pino-pretty isn't installed
    transport = undefined;
  }
}

const baseLogger = pino({
  level: logLevel,
  base: {
    service: 'baocaoluadao',
    version: process.env.npm_package_version || 'unknown',
  },
  transport,
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
