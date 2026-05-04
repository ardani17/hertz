import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Disallow API routes
Disallow: /api/

# Disallow admin routes
Disallow: /ghost-admin/

# Sitemap
Sitemap: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://horizonfx.id'}/sitemap.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}