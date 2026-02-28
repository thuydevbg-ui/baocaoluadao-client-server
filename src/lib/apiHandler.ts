import { NextRequest, NextResponse } from 'next/server';
import { logDuration, getLogger } from './logger';
import { createRequestId } from './requestId';
import { captureException } from './sentry';

export interface ApiContext {
  requestId: string;
  logger: ReturnType<typeof getLogger>;
}

export type ApiHandler<T extends NextResponse = NextResponse> = (
  request: NextRequest,
  context: ApiContext
) => Promise<T> | T;

export function withApiObservability<T extends NextResponse>(
  handler: ApiHandler<T>
): (request: NextRequest) => Promise<T> {
  return async function wrapped(request: NextRequest) {
    const requestId = createRequestId(request.headers.get('x-request-id'));
    const logger = getLogger({
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
    });

    const start = Date.now();

    try {
      const response = await handler(request, { requestId, logger });
      const duration = Date.now() - start;
      logDuration('http.request', duration, { requestId, method: request.method, path: request.nextUrl.pathname });

      if (response instanceof NextResponse) {
        response.headers.set('x-request-id', requestId);
        response.headers.set('x-request-duration-ms', duration.toString());
      }

      return response;
    } catch (error) {
    captureException(error, {
      requestId,
      path: request.nextUrl.pathname,
      method: request.method,
    });
      logger.error({ err: error instanceof Error ? error.message : 'unknown' }, 'Unhandled API error');
      throw error;
    }
  };
}
