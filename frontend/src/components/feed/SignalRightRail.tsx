import type { MemberSessionUser } from '@shared/types';
import { InsightIcon, PulseIcon, SearchIcon } from './SignalIcons';
import styles from './SignalRails.module.css';

function Sparkline({ tone = 'up' }: { tone?: 'up' | 'down' }) {
  const points = tone === 'up' ? '0,28 12,17 25,21 38,10 52,14 68,6 86,11 100,4' : '0,7 12,14 25,11 38,22 52,18 68,27 86,20 100,29';
  return (
    <svg className={styles.sparkline} viewBox="0 0 100 34" aria-hidden="true">
      <path d={`M${points}`} />
    </svg>
  );
}

export function SignalRightRail({ currentUser }: { currentUser: MemberSessionUser | null }) {
  return (
    <aside className={styles.right} aria-label="Market intelligence">
      <div className={styles.searchBox}>
        <SearchIcon />
        <span>Cari pair, jurnal, atau member</span>
      </div>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2><PulseIcon /> Market Pulse</h2>
          <a href="/tools">Lihat semua</a>
        </div>
        <div className={styles.marketRow}><div><strong>XAUUSD</strong><span>Gold / U.S. Dollar</span></div><Sparkline /><div><strong>2,337.62</strong><span className={styles.up}>+0.36%</span></div></div>
        <div className={styles.marketRow}><div><strong>BTC/USDT</strong><span>Binance</span></div><Sparkline tone="down" /><div><strong>66,721.18</strong><span className={styles.down}>-0.19%</span></div></div>
        <div className={styles.marketRow}><div><strong>DXY</strong><span>U.S. Dollar Index</span></div><Sparkline /><div><strong>104.35</strong><span className={styles.up}>+0.17%</span></div></div>
        <p className={styles.freshness}>Data sementara</p>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2><InsightIcon /> High Impact Next</h2>
          <a href="/tools/economic-calendar">Lihat kalender</a>
        </div>
        <div className={styles.eventRow}><span>19:30<br />USD</span><strong>Non-Farm Payrolls</strong><em>02:14:32 lagi</em></div>
        <div className={styles.eventRow}><span>21:00<br />USD</span><strong>Unemployment Rate</strong><em>03:44:32 lagi</em></div>
      </section>
      {currentUser?.role === 'admin' ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Telegram Sync</h2>
          </div>
          <p className={styles.muted}>Draft menunggu review hanya tampil untuk admin.</p>
          <a className={styles.adminLink} href="/admin/signal-ledger">Buka queue</a>
        </section>
      ) : null}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Quick Tools</h2>
        </div>
        <div className={styles.toolGrid}>
          <a className={styles.toolLink} href="/tools/pivot-point">Pivot</a>
          <a className={styles.toolLink} href="/tools/profitability">Profitability</a>
          <a className={styles.toolLink} href="/tools/order-book">Order Book</a>
          <a className={styles.toolLink} href="/tools/cftc">CFTC</a>
        </div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Topik panas</h2>
          <a href="/?category=trading">Lihat semua</a>
        </div>
        <div className={styles.topicRow}><strong>#gold</strong><span>12.4K posts</span><Sparkline /></div>
        <div className={styles.topicRow}><strong>#risk1percent</strong><span>6.1K posts</span><Sparkline /></div>
      </section>
      <div className={styles.railFooter}>Data delay 15m <span /> Connected</div>
    </aside>
  );
}
