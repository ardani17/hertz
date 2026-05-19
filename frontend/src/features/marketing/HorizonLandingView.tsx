import type { HertzPost } from '@shared/types';
import type { MarketRailGroup } from '@/lib/globalDataMarket';
import { getForexHeroModel, previewPostLine } from './lib/landing-data';
import { LandingCta } from './sections/LandingCta';
import { LandingFaq } from './sections/LandingFaq';
import { LandingFooter } from './sections/LandingFooter';
import { LandingHero } from './sections/LandingHero';
import { LandingHowItWorks } from './sections/LandingHowItWorks';
import { LandingNav } from './sections/LandingNav';
import { LandingProducts } from './sections/LandingProducts';
import { LandingTestimonials } from './sections/LandingTestimonials';
import { LandingTicker } from './sections/LandingTicker';
import styles from './HorizonLanding.module.css';

type HorizonLandingViewProps = {
  previewPost: HertzPost | null;
  marketGroups: MarketRailGroup[];
};

export function HorizonLandingView({ previewPost, marketGroups }: HorizonLandingViewProps) {
  const { heroAsset, supportingRows } = getForexHeroModel(marketGroups);

  return (
    <main className={styles.main}>
      <LandingNav />
      <LandingHero previewPost={previewPost} heroAsset={heroAsset} supportingRows={supportingRows} />
      <LandingTicker marketGroups={marketGroups} />
      <LandingHowItWorks />
      <LandingProducts previewLine={previewPostLine(previewPost)} />
      <LandingTestimonials />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </main>
  );
}
