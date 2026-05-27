import { randomUUID } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

export interface RequestLogContext {
  requestId: string;
  startedAt: number;
}

export function createRequestLogContext(request: NextRequest): RequestLogContext {
  return {
    requestId: request.headers.get('x-request-id') || randomUUID(),
    startedAt: Date.now(),
  };
}

export function finishRequestLog(
  request: NextRequest,
  response: NextResponse,
  context: RequestLogContext,
  userId?: string | null,
): NextResponse {
  response.headers.set('X-Request-ID', context.requestId);
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level: response.status >= 500 ? 'error' : response.status >= 400 ? 'warn' : 'info',
    route: `${request.method} ${request.nextUrl.pathname}`,
    status: response.status,
    requestId: context.requestId,
    userId: userId ?? null,
    latencyMs: Date.now() - context.startedAt,
  }));
  return response;
}

