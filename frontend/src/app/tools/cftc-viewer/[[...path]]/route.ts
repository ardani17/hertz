import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** CFTC viewer hidden until tool is published — return 404 for all paths. */
export async function GET() {
  return new NextResponse(null, { status: 404 });
}
