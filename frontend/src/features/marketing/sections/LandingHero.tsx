import Link from 'next/link';
import type { HertzPost } from '@shared/types';
import type { MarketRailRow } from '@/lib/globalDataMarket';
import { buildSparklineArea, buildSparklinePath } from '../lib/sparkline';
import styles from '../HorizonLanding.module.css';

type LandingHeroProps = {
  previewPost: HertzPost | null;
  heroAsset: MarketRailRow | null;
  supportingRows: MarketRailRow[];
};

export function LandingHero({ previewPost, heroAsset, supportingRows }: LandingHeroProps) {
  const heroPath = buildSparklinePath(heroAsset?.sparkline ?? []);
  const heroArea = buildSparklineArea(heroAsset?.sparkline ?? []);

  return (
    <section className={styles.hero} aria-labelledby="horizon-market-title">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Free forex workspace for serious traders</p>
        <h1 id="horizon-market-title">Everything a Forex Trader Needs. One Platform.</h1>
        <p className={styles.lead}>
          Live market data, trade journaling, daily analysis, and research tools — all in one place.
          Stop switching between 5 apps. Start trading with clarity.
        </p>
        <div className={styles.actions}>
          <div className={styles.ctaPrimaryWrap}>
            <Link className={styles.primary} href="/hertz">
              Join Free — No Credit Card
            </Link>
            <span className={styles.microcopy}>Takes 30 seconds. Free forever.</span>
          </div>
          <Link className={styles.secondary} href="/outlook">
            See How It Works
          </Link>
        </div>
        <div className={styles.trustRow} aria-label="Horizon live data summary">
          <span>Live Forex Data</span>
          <span>Free to Join</span>
          <span>{previewPost ? 'Active Community' : 'Active Community'}</span>
        </div>
      </div>

      <aside className={styles.forexHero} aria-label="Live forex market preview">
        {heroAsset ? (
          <>
            <div className={styles.heroAssetTop}>
              <div>
                <span className={styles.marketLabel}>Live forex</span>
                <strong>{heroAsset.symbol}</strong>
                <p>{heroAsset.symbol === 'XAUUSD' ? 'Gold / US Dollar' : 'Major forex pair'}</p>
              </div>
              <div className={styles.heroPrice}>
                <strong>{heroAsset.price}</strong>
                <em data-down={heroAsset.tone === 'down' ? 'true' : 'false'}>{heroAsset.change}</em>
              </div>
            </div>

            <div className={styles.chartFrame}>
              <svg className={styles.heroChart} viewBox="0 0 640 220" aria-hidden="true">
                {heroArea ? (
                  <path
                    className={styles.chartArea}
                    d={heroArea}
                    data-down={heroAsset.tone === 'down' ? 'true' : 'false'}
                  />
                ) : null}
                {heroPath ? (
                  <path
                    className={styles.chartLine}
                    d={heroPath}
                    data-down={heroAsset.tone === 'down' ? 'true' : 'false'}
                  />
                ) : null}
              </svg>
            </div>

            <div className={styles.forexStrip} aria-label="Major forex pairs">
              {supportingRows.map((row) => {
                const miniPath = buildSparklinePath(row.sparkline, 140, 42);
                return (
                  <div className={styles.forexTile} key={row.symbol}>
                    <span>{row.symbol}</span>
                    <strong>{row.price}</strong>
                    <em data-down={row.tone === 'down' ? 'true' : 'false'}>{row.change}</em>
                    {miniPath ? (
                      <svg viewBox="0 0 140 42" aria-hidden="true">
                        <path d={miniPath} data-down={row.tone === 'down' ? 'true' : 'false'} />
                      </svg>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.emptyMarket}>Forex market data sedang diperbarui.</div>
        )}
      </aside>
    </section>
  );
}
