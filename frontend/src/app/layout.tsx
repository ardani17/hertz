import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import Script from 'next/script';
import { ToastProvider } from '@/components/ui/Toast';
import { HertzSWRProvider } from '@/lib/swr/config';
import { themeInitScript } from '@/lib/theme-init';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Hertz Trader Platform',
    template: '%s | Hertz',
  },
  description:
    'Komunitas trader — jurnal trading, cerita kehidupan, dan analisa market.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Hertz Trader Platform',
    title: 'Hertz Trader Platform',
    description:
      'Komunitas trader — jurnal trading, cerita kehidupan, dan analisa market.',
    images: [{ url: '/images/og-default.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hertz Trader Platform',
    description:
      'Komunitas trader — jurnal trading, cerita kehidupan, dan analisa market.',
    images: ['/images/og-default.svg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${dmSans.variable} dark`} data-theme="dark">
      <head>
        <link rel="icon" href="/images/logo/Logo-Hertz-Atom-Online-Black_7.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/images/logo/Logo-Hertz-Atom-Online-White_8.png" media="(prefers-color-scheme: dark)" />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">
          Langsung ke konten
        </a>
        <ToastProvider>
          <HertzSWRProvider>
            <div id="main-content">{children}</div>
          </HertzSWRProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
