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
        <p className={styles.eyebrow}>Workspace forex gratis untuk trader serius</p>
        <h1 id="horizon-market-title">Semua yang Trader Forex Butuh. Satu Platform.</h1>
        <p className={styles.lead}>
          Data market live, jurnal trading, analisa harian, dan tools riset — dalam satu tempat.
          Berhenti bolak-balik aplikasi. Mulai trading dengan konteks yang jelas.
        </p>
        <div className={styles.actions}>
          <div className={styles.ctaPrimaryWrap}>
            <Link className={styles.primary} href="/hertz">
              Gabung Gratis — Tanpa Kartu Kredit
            </Link>
            <span className={styles.microcopy}>Daftar ~30 detik. Gratis selamanya.</span>
          </div>
          <Link className={styles.secondary} href="/outlook">
            Lihat Cara Kerjanya
          </Link>
        </div>
        <div className={styles.trustRow} aria-label="Ringkasan Horizon">
          <span>Data Forex Live</span>
          <span>Gratis untuk Member</span>
          <span>{previewPost ? 'Komunitas Aktif' : 'Komunitas Trader'}</span>
        </div>
      </div>

      <aside className={styles.forexHero} aria-label="Pratinjau market forex live">
        {heroAsset ? (
          <>
            <div className={styles.heroAssetTop}>
              <div>
                <span className={styles.marketLabel}>Forex live</span>
                <strong>{heroAsset.symbol}</strong>
                <p>{heroAsset.symbol === 'XAUUSD' ? 'Emas / Dolar AS' : 'Pair forex utama'}</p>
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

            <div className={styles.forexStrip} aria-label="Pair forex utama">
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
          <div className={styles.emptyMarket}>Data market akan tampil saat koneksi tersedia.</div>
        )}
      </aside>
    </section>
  );
}
