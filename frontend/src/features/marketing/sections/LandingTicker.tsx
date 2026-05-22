import type { MarketRailGroup } from '@/lib/globalDataMarket';
import { buildSparklinePath } from '../lib/sparkline';
import styles from '../HorizonLanding.module.css';

function TickerSparkline({ points, tone }: { points: number[]; tone: string }) {
  const path = buildSparklinePath(points, 56, 20);
  if (!path) return null;
  return (
    <svg className={styles.tickerSpark} viewBox="0 0 56 20" aria-hidden="true">
      <path d={path} data-down={tone === 'down' ? 'true' : 'false'} />
    </svg>
  );
}

export function LandingTicker({ marketGroups }: { marketGroups: MarketRailGroup[] }) {
  if (marketGroups.length === 0) return null;

  return (
    <section className={styles.tickerStrip} aria-label="Ticker market live">
      <div className={styles.tickerInner}>
        {marketGroups.map((group) => (
          <div className={styles.tickerGroup} key={group.title}>
            <div className={styles.tickerGroupLabel}>{group.title}</div>
            <div className={styles.tickerItems}>
              {group.rows.slice(0, 6).map((row) => (
                <div className={styles.tickerItem} key={row.symbol}>
                  <span className={styles.tickerSymbol}>{row.symbol}</span>
                  <span className={styles.tickerPrice}>{row.price}</span>
                  <em className={styles.tickerChange} data-down={row.tone === 'down' ? 'true' : 'false'}>
                    {row.change}
                  </em>
                  <TickerSparkline points={row.sparkline} tone={row.tone} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
