import {
  TRADING_LEVEL_LABELS,
  TRADING_MARKET_LABELS,
  type MemberTradingProfile,
} from '@shared/types/memberProfile';
import styles from './ProfileTradingCard.module.css';

export function ProfileTradingCard({ trading }: { trading: MemberTradingProfile }) {
  const hasLevel = Boolean(trading.experienceLevel);
  const hasMarkets = trading.markets.length > 0;
  const hasYear = Boolean(trading.sinceYear);
  const hasStyle = Boolean(trading.style?.trim());

  if (!hasLevel && !hasMarkets && !hasYear && !hasStyle) return null;

  return (
    <section className={styles.section}>
      <h3>Pengalaman trading</h3>
      <div className={styles.card}>
        {hasLevel ? (
          <p className={styles.level}>
            {TRADING_LEVEL_LABELS[trading.experienceLevel!]}
          </p>
        ) : null}
        {hasMarkets ? (
          <ul className={styles.markets}>
            {trading.markets.map((market) => (
              <li key={market}>{TRADING_MARKET_LABELS[market]}</li>
            ))}
          </ul>
        ) : null}
        {hasYear ? <p className={styles.meta}>Mulai sejak {trading.sinceYear}</p> : null}
        {hasStyle ? <p className={styles.style}>{trading.style}</p> : null}
      </div>
    </section>
  );
}
