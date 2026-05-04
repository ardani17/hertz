import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'academy.horizonfx.id',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://static.cloudflareinsights.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net https://cloudflareinsights.com; img-src 'self' data: https: http:; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
      {
        source: '/liquidity-outlook',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://dashboard.acuitytrading.com https://*.acuitytrading.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://dashboard.acuitytrading.com https://*.acuitytrading.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://dashboard.acuitytrading.com https://*.acuitytrading.com; img-src 'self' data: https: http:; connect-src 'self' https://dashboard.acuitytrading.com https://*.acuitytrading.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net https://cloudflareinsights.com wss: ws:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
