import { SearchIcon, SignalIcon } from './SignalIcons';
import styles from './SignalRails.module.css';

const groups = [
  {
    title: 'Forex Market',
    rows: [
      ['XAUUSD', '2,337.62', '+0.36%', 'up'],
      ['EURUSD', '1.08421', '+0.19%', 'up'],
      ['GBPUSD', '1.26380', '-0.08%', 'down'],
      ['USDJPY', '155.72', '+0.12%', 'up'],
    ],
  },
  {
    title: 'Crypto Market',
    rows: [
      ['BTC/USDT', '66,721.18', '-0.19%', 'down'],
      ['ETH/USDT', '3,107.40', '+0.84%', 'up'],
      ['SOL/USDT', '148.22', '+1.21%', 'up'],
      ['BNB/USDT', '594.80', '-0.32%', 'down'],
    ],
  },
  {
    title: 'Stock Market',
    rows: [
      ['NASDAQ', '18,093.75', '+0.42%', 'up'],
      ['S&P 500', '5,221.30', '+0.28%', 'up'],
      ['DOW', '39,872.99', '-0.11%', 'down'],
      ['TSLA', '178.90', '+1.04%', 'up'],
    ],
  },
] as const;

function Sparkline({ tone }: { tone: 'up' | 'down' }) {
  const d = tone === 'down'
    ? 'M2 8 L16 12 L30 11 L44 17 L58 15 L72 22 L92 24'
    : 'M2 23 L16 17 L30 19 L44 12 L58 15 L74 8 L92 10';
  return (
    <svg className={styles.sparkline} viewBox="0 0 94 30" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function SignalRightRail() {
  return (
    <aside className={styles.right} aria-label="Market intelligence">
      <div className={styles.searchBox}>
        <SearchIcon />
        <span>Cari pair, jurnal, atau member</span>
      </div>
      {groups.map((group) => (
        <section className={styles.marketPanel} key={group.title}>
          <div className={styles.marketTitle}>
            <SignalIcon />
            <span>{group.title}</span>
          </div>
          {group.rows.map(([symbol, price, change, tone]) => (
            <div className={styles.marketRow} key={symbol}>
              <strong>{symbol}</strong>
              <Sparkline tone={tone} />
              <div>
                <b>{price}</b>
                <em className={tone === 'down' ? styles.down : styles.up}>{change}</em>
              </div>
            </div>
          ))}
        </section>
      ))}
    </aside>
  );
}
