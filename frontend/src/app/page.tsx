import type { Metadata } from 'next';
import { HorizonLandingView } from '@/features/marketing/HorizonLandingView';
import { getLandingMarketGroups, getLandingPreviewPost } from '@/features/marketing/lib/landing-data';

export const revalidate = 300;

/** Landing tetap SSR/ISR penuh untuk SEO — bukan pola SPA client-shell. */
export const metadata: Metadata = {
  title: 'Horizon — Everything a Forex Trader Needs. One Platform.',
  description:
    'Live market data, trade journaling, daily analysis, and research tools — all in one place. Free forever, no credit card required.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Horizon — Everything a Forex Trader Needs. One Platform.',
    description:
      'Live market data, trade journaling, daily analysis, and research tools — all in one place. Free forever, no credit card required.',
    url: '/',
    type: 'website',
  },
};

export default async function HorizonLandingPage() {
  const [previewPost, marketGroups] = await Promise.all([
    getLandingPreviewPost(),
    getLandingMarketGroups(),
  ]);

  return <HorizonLandingView previewPost={previewPost} marketGroups={marketGroups} />;
}
