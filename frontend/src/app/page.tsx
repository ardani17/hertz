import type { Metadata } from 'next';
import { HorizonLandingView } from '@/features/marketing/HorizonLandingView';
import { getLandingMarketGroups, getLandingPreviewPost } from '@/features/marketing/lib/landing-data';

export const revalidate = 300;

/** Landing tetap SSR/ISR penuh untuk SEO — bukan pola SPA client-shell. */
export const metadata: Metadata = {
  title: 'Horizon — Semua yang Trader Forex Butuh. Satu Platform.',
  description:
    'Data market live, jurnal trading, analisa harian, dan tools riset — dalam satu workspace. Gratis selamanya, tanpa kartu kredit.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Horizon — Semua yang Trader Forex Butuh. Satu Platform.',
    description:
      'Data market live, jurnal trading, analisa harian, dan tools riset — dalam satu workspace. Gratis selamanya, tanpa kartu kredit.',
    url: '/',
    type: 'website',
    locale: 'id_ID',
  },
};

export default async function HorizonLandingPage() {
  const [previewPost, marketGroups] = await Promise.all([
    getLandingPreviewPost(),
    getLandingMarketGroups(),
  ]);

  return <HorizonLandingView previewPost={previewPost} marketGroups={marketGroups} />;
}
