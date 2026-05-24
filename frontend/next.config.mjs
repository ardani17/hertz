import createBundleAnalyzer from '@next/bundle-analyzer';
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const configDir = dirname(fileURLToPath(import.meta.url));
// Muat .env repo root agar `npm run dev:frontend` tanpa `source .env` tetap punya TELEGRAM_BOT_NAME, dll.
loadEnv({ path: resolve(configDir, '../.env') });
loadEnv({ path: resolve(configDir, '.env.local'), override: true });

const telegramBotName =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || process.env.TELEGRAM_BOT_NAME || '';

// Login dev hanya saat `next dev` + frontend/.env.local — tidak ikut `next build` / produksi.
const isNextDevServer = process.argv.includes('dev');
const allowDevTelegramLogin =
  isNextDevServer && process.env.ALLOW_DEV_TELEGRAM_LOGIN === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // pg native modules and bcryptjs must run as CommonJS at runtime, not
  // be bundled by Turbopack. Bundling pg breaks the connection pool with
  // "Connection terminated unexpectedly" errors.
  serverExternalPackages: ['pg', 'pg-native', 'bcryptjs', 'ioredis'],
  env: {
    NEXT_PUBLIC_TELEGRAM_BOT_NAME: telegramBotName,
    NEXT_PUBLIC_ALLOW_DEV_TELEGRAM_LOGIN: allowDevTelegramLogin ? 'true' : '',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'image.cloudnexify.com',
      },
      {
        protocol: 'https',
        hostname: 'academy.horizonfx.id',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      {
        source: '/artikel/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://image.cloudnexify.com https://*.r2.dev https://academy.horizonfx.id https://i.ibb.co https://api.dicebear.com https://t.me https://telegram.org https://*.telegram.org https://*.telegram-cdn.org https://*.cdn-telegram.org https://*.telesco.pe",
              "media-src 'self' blob: https://image.cloudnexify.com https://*.r2.dev https://academy.horizonfx.id",
              "connect-src 'self' https://image.cloudnexify.com https://cloudflareinsights.com",
              "frame-src https://oauth.telegram.org",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

const withBundleAnalyzer = createBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

export default withBundleAnalyzer(nextConfig);

