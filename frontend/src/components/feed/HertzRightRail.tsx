import { SearchIcon, PulseIcon } from './HertzIcons';
import styles from './HertzRails.module.css';

const groups = [
  {
    title: 'Forex Market',
    rows: [
      { symbol: 'XAUUSD', price: '2,337.62', change: '+0.36%', tone: 'up' },
      { symbol: 'EURUSD', price: '1.08421', change: '+0.19%', tone: 'up' },
      { symbol: 'GBPUSD', price: '1.26380', change: '-0.08%', tone: 'down' },
      { symbol: 'USDJPY', price: '155.72', change: '+0.12%', tone: 'up' },
    ],
  },
  {
    title: 'Crypto Market',
    rows: [
      { symbol: 'BTC/USDT', price: '66,721.18', change: '-0.19%', tone: 'down' },
      { symbol: 'ETH/USDT', price: '3,107.40', change: '+0.84%', tone: 'up' },
      { symbol: 'SOL/USDT', price: '148.22', change: '+1.21%', tone: 'up' },
      { symbol: 'BNB/USDT', price: '594.80', change: '-0.32%', tone: 'down' },
    ],
  },
  {
    title: 'Stock Market',
    rows: [
      { symbol: 'NASDAQ', price: '18,093.75', change: '+0.42%', tone: 'up' },
      { symbol: 'S&P 500', price: '5,221.30', change: '+0.28%', tone: 'up' },
      { symbol: 'DOW', price: '39,872.99', change: '-0.11%', tone: 'down' },
      { symbol: 'TSLA', price: '178.90', change: '+1.04%', tone: 'up' },
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

export function HertzRightRail({ activeSearch }: { activeSearch?: string | null }) {
  return (
    <aside className={styles.right} aria-label="Market intelligence">
      <form className={styles.searchBox} action="/hertz">
        <SearchIcon />
        <input name="q" defaultValue={activeSearch ?? ''} placeholder="Cari pair, jurnal, atau member" aria-label="Cari HERTZ" />
      </form>
      {groups.map((group) => (
        <section className={styles.marketPanel} key={group.title}>
          <div className={styles.marketTitle}>
            <PulseIcon />
            <span>{group.title}</span>
          </div>
          {group.rows.map((row) => (
            <div className={styles.marketRow} key={row.symbol}>
              <strong>{row.symbol}</strong>
              <Sparkline tone={row.tone} />
              <div>
                <b>{row.price}</b>
                <em className={row.tone === 'down' ? styles.down : styles.up}>{row.change}</em>
              </div>
            </div>
          ))}
        </section>
      ))}
    </aside>
  );
}
