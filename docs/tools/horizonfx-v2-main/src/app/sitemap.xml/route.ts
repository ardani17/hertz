import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://horizonfx.id';
  
  // Static routes
  const staticRoutes = [
    '',
    '/blog',
    '/contact',
    '/economic-calendar',
    '/elliot-calculator',
    '/exchange-liquidity',
    '/pivot-point',
    '/privacy',
    '/profitability-calculator',
    '/terms'
  ];

  let dynamicRoutes: string[] = [];
  
  // Only fetch dynamic routes at runtime, not during build
  if (process.env.NODE_ENV !== 'production' || process.env.MONGODB_URI) {
    try {
      // Get dynamic blog routes from database
      const mongoose = await connectDB();
      const db = mongoose.connection.db;
      if (db) {
        const newsCollection = db.collection('news');
        const blogPosts = await newsCollection.find(
          { published: true },
          { projection: { slug: 1 } }
        ).toArray();
        
        dynamicRoutes = blogPosts.map((post) => `/blog/${post.slug}`);
      }
    } catch (error) {
      console.error('Error fetching blog posts for sitemap:', error);
      // Silently fail during build - sitemap will only have static routes
    }
  }

  const allRoutes = [...staticRoutes, ...dynamicRoutes];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(route => {
    const url = `${baseUrl}${route}`;
    const lastmod = new Date().toISOString().split('T')[0];
    const priority = route === '' ? '1.0' : route.startsWith('/blog/') ? '0.8' : '0.7';
    const changefreq = route === '' ? 'daily' : route.startsWith('/blog/') ? 'weekly' : 'monthly';
    
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}