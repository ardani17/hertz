import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/api/mobile/v1/:path*'],
};

function compareSemver(a: string, b: string): number {
  const left = a.split('.').map((part) => Number(part) || 0);
  const right = b.split('.').map((part) => Number(part) || 0);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

function isAppVersionExempt(pathname: string): boolean {
  return pathname.includes('/api/mobile/v1/auth/handoff/');
}

function withRequestLog(request: NextRequest, response: NextResponse, requestId: string, startedAt: number): NextResponse {
  response.headers.set('X-Request-ID', requestId);
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level: response.status >= 500 ? 'error' : response.status >= 400 ? 'warn' : 'info',
    route: `${request.method} ${request.nextUrl.pathname}`,
    status: response.status,
    requestId,
    latencyMs: Date.now() - startedAt,
  }));
  return response;
}

export function middleware(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = request.headers.get('x-request-id') || globalThis.crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set('x-request-id', requestId);

  const minimum = process.env.MOBILE_MIN_APP_VERSION?.trim();
  const appVersion = request.headers.get('app-version')?.trim();
  if (minimum && appVersion && compareSemver(appVersion, minimum) < 0 && !isAppVersionExempt(request.nextUrl.pathname)) {
    return withRequestLog(request, NextResponse.json({
      success: false,
      error: {
        code: 'UPGRADE_REQUIRED',
        error_code: 'UPGRADE_REQUIRED',
        message: 'Versi aplikasi Anda tidak lagi didukung. Update ke versi terbaru.',
        details: { minVersion: minimum, currentVersion: appVersion },
        timestamp: new Date().toISOString(),
      },
    }, { status: 426 }), requestId, startedAt);
  }

  const response = NextResponse.next({ request: { headers } });
  response.headers.set('X-Request-ID', requestId);
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level: 'info',
    route: `${request.method} ${request.nextUrl.pathname}`,
    status: 0,
    requestId,
    latencyMs: Date.now() - startedAt,
  }));
  return response;
}

