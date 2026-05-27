import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/api/mobile/v1/:path*'],
};

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  if (!headers.get('x-request-id')) {
    headers.set('x-request-id', globalThis.crypto.randomUUID());
  }
  return NextResponse.next({ request: { headers } });
}

