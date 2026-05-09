import type { Metadata } from 'next';
import Image from 'next/image';
import styles from './HorizonLanding.module.css';

export const metadata: Metadata = {
  title: 'Horizon',
  description: 'Platform Horizon untuk HERTZ social trading, Outlook, Blog, dan tools market.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Horizon',
    description: 'HERTZ social trading, Outlook, Blog, dan tools market dalam satu platform.',
    url: '/',
    type: 'website',
  },
};

export default function HorizonLanding() {
  return (
    <main className={styles.main}>
      <header className={styles.navbar}>
        <a className={styles.navBrand} href="/">
          <Image src="/images/logo/Logo-Horizon-Atom-Online-White_8.png" alt="" width={42} height={42} priority />
          <strong>HORIZON</strong>
        </a>
        <nav aria-label="Horizon navigation">
          <a href="/hertz">HERTZ</a>
          <a href="/outlook">Outlook</a>
          <a href="/blog">Blog</a>
          <a href="/tools">Tools</a>
        </nav>
        <a className={styles.login} href="/hertz">Masuk HERTZ</a>
      </header>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <h1>Horizon</h1>
          <p className={styles.lead}>Platform trading untuk komunitas yang hidup di market.</p>
          <p className={styles.subcopy}>Horizon menyatukan social feed HERTZ, outlook market dari WordPress, blog member, dan tools riset dalam satu ekosistem yang cepat dan rapi.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="/hertz">Buka HERTZ</a>
            <a className={styles.secondary} href="/tools">Lihat Tools</a>
          </div>
          <div className={styles.featureGrid}>
            <div><strong>Verified social layer</strong><span>Member Telegram posting, pulse, repost, blog, dan DM.</span></div>
            <div><strong>Market-first design</strong><span>Forex, crypto, dan stock rail selalu tersedia.</span></div>
            <div><strong>Telegram native</strong><span>Alur publish Telegram tetap dipertahankan untuk admin.</span></div>
          </div>
        </div>
        <div className={styles.preview} aria-label="HERTZ preview">
          <div className={styles.previewTitle}>
            <Image src="/images/logo/Logo-Horizon-Atom-Online-White_8.png" alt="" width={34} height={34} />
            <strong>HERTZ</strong>
          </div>
          <div className={styles.previewComposer}>Kirim jurnal dari Telegram atau tulis setup...</div>
          <article className={styles.previewPost}>
            <span>TR</span>
            <div>
              <strong>Trader Rizky <em>Verified</em></strong>
              <p>Gold reject 2338. Tunggu retest, jangan kejar candle.</p>
              <svg viewBox="0 0 260 48" aria-hidden="true"><path d="M2 37 24 25 44 30 68 18 92 22 118 12 144 16 170 9 198 22 226 14 258 8" /></svg>
              <small>Comment 12 Repost 2 Signal 4</small>
            </div>
          </article>
          <div className={styles.previewNote}>
            <strong>Catatan komunitas</strong>
            <span>Data liquidity menunjukkan buy limit aktif di 2332-2335.</span>
          </div>
          <div className={styles.previewMarket}>
            <strong>Market rail preview</strong>
            <svg viewBox="0 0 140 34" aria-hidden="true"><path d="M2 27 22 18 42 21 64 11 86 16 110 9 138 5" /></svg>
          </div>
        </div>
      </section>
      <section className={styles.marketStrip} aria-label="Market preview">
        {[
          ['Forex Market', 'XAUUSD', 'EURUSD', 'GBPUSD'],
          ['Crypto Market', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
        ].map((group) => (
          <div className={styles.marketCard} key={group[0]}>
            <strong>{group[0]}</strong>
            {group.slice(1).map((symbol, index) => (
              <div key={symbol}>
                <span>{symbol}</span>
                <svg viewBox="0 0 92 26" aria-hidden="true" data-down={index === 2 ? 'true' : 'false'}>
                  <path d={index === 2 ? 'M2 8 18 13 34 12 50 20 68 17 90 24' : 'M2 22 18 15 34 18 52 10 70 14 90 7'} />
                </svg>
                <em>{index === 2 ? '-0.22%' : '+0.21%'}</em>
              </div>
            ))}
          </div>
        ))}
      </section>
      <section className={styles.products}>
        {[
          ['HERTZ', 'Social trading feed', '/hertz'],
          ['Outlook', 'WordPress market outlook', '/outlook'],
          ['Blog', 'Member-written articles', '/blog'],
          ['Tools', 'Trading research utilities', '/tools'],
        ].map(([title, text, href]) => (
          <a href={href} key={href}>
            <strong>{title}</strong>
            <span>{text}</span>
            <em>{href}</em>
          </a>
        ))}
      </section>
      <footer className={styles.footer}>Designed as the public face of Horizon. HERTZ is the social product inside it.</footer>
    </main>
  );
}
