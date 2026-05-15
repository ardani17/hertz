import type { HertzPost } from '@shared/types';
import styles from './HertzPost.module.css';

export function HertzMarketMeta({ post }: { post: HertzPost }) {
  const market = post.market;
  if (!market || (!market.entryPrice && !market.entryZone && !market.stopLoss && !market.takeProfit && !market.confidencePercent)) {
    return null;
  }

  const rows = [
    ['TP', market.takeProfit1 ?? market.takeProfit],
    ['Key Level', market.entryZone ?? market.entryPrice],
    ['Buy zone', market.stopLoss],
  ].filter(([, value]) => value);

  return (
    <div className={styles.marketCard}>
      <dl>
        {rows.map(([label, value]) => (
          <div className={styles.marketRowMini} key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
