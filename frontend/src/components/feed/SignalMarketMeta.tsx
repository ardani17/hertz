import type { SignalPost } from '@shared/types';
import styles from './SignalPost.module.css';

export function SignalMarketMeta({ post }: { post: SignalPost }) {
  const market = post.market;
  if (!market || (!market.entryPrice && !market.entryZone && !market.stopLoss && !market.takeProfit && !market.confidencePercent)) {
    return null;
  }

  return (
    <div className={styles.marketCard}>
      <div>
        <span>Setup reference</span>
        <strong>{market.pair ?? 'Market setup'} {market.direction ? ` ${market.direction}` : ''}</strong>
      </div>
      <dl>
        {market.entryPrice || market.entryZone ? <><dt>Entry</dt><dd>{market.entryZone ?? market.entryPrice}</dd></> : null}
        {market.takeProfit || market.takeProfit1 ? <><dt>TP</dt><dd>{market.takeProfit1 ?? market.takeProfit}</dd></> : null}
        {market.stopLoss ? <><dt>SL</dt><dd>{market.stopLoss}</dd></> : null}
        {market.confidencePercent ? <><dt>Confidence</dt><dd>{market.confidencePercent}%</dd></> : null}
      </dl>
    </div>
  );
}
