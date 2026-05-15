import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { HertzPostService } from '@shared/services/hertzPostService';
import type { SignalPost } from '@shared/types';
import styles from './HorizonLanding.module.css';

export const dynamic = 'force-dynamic';

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

const marketGroups = [
  {
    title: 'Forex Market',
    rows: [
      { symbol: 'XAUUSD', change: '+0.36%', tone: 'up' },
      { symbol: 'EURUSD', change: '+0.19%', tone: 'up' },
      { symbol: 'GBPUSD', change: '-0.08%', tone: 'down' },
    ],
  },
  {
    title: 'Crypto Market',
    rows: [
      { symbol: 'BTC/USDT', change: '-0.19%', tone: 'down' },
      { symbol: 'ETH/USDT', change: '+0.84%', tone: 'up' },
      { symbol: 'SOL/USDT', change: '+1.21%', tone: 'up' },
    ],
  },
] as const;

async function getLandingPreviewPost(): Promise<SignalPost | null> {
  try {
    const feed = new HertzPostService();
    const result = await feed.listFeed({ limit: 1, sort: 'latest' });
    return result.items[0] ?? null;
  } catch {
    return null;
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'HZ';
}

function categoryInitials(post: SignalPost) {
  if (post.category === 'trading_room') return 'TR';
  if (post.category === 'life_coffee') return 'LC';
  if (post.category === 'community_note') return 'CN';
  return initials(post.author.name);
}

export default async function HorizonLanding() {
  const previewPost = await getLandingPreviewPost();

  return (
    <main className={styles.main}>
      <header className={styles.navbar}>
        <Link className={styles.navBrand} href="/">
          <Image src="/images/logo/Logo-Horizon-Atom-Online-White_8.png" alt="" width={42} height={42} priority />
          <strong>HORIZON</strong>
        </Link>
        <nav aria-label="Horizon navigation">
          <Link href="/hertz">HERTZ</Link>
          <Link href="/outlook">Outlook</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/tools">Tools</Link>
        </nav>
        <Link className={styles.login} href="/hertz">Masuk HERTZ</Link>
      </header>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <h1>Horizon</h1>
          <p className={styles.lead}>Platform trading untuk komunitas yang hidup di market.</p>
          <p className={styles.subcopy}>Horizon menyatukan social feed HERTZ, outlook market, blog import WordPress, dan tools riset dalam satu ekosistem yang cepat dan rapi.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/hertz">Buka HERTZ</Link>
            <Link className={styles.secondary} href="/tools">Lihat Tools</Link>
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
          {previewPost ? (
            <>
              <article className={styles.previewPost}>
                <span>{categoryInitials(previewPost)}</span>
                <div>
                  <strong>{previewPost.author.name}<em>{previewPost.author.badge === 'admin' ? 'Admin' : 'Verified'}</em></strong>
                  <p>{previewPost.content.text}</p>
                  <svg viewBox="0 0 260 48" aria-hidden="true"><path d="M2 37 24 25 44 30 68 18 92 22 118 12 144 16 170 9 198 22 226 14 258 8" /></svg>
                  <small>Comment {previewPost.counts.comments} Repost {previewPost.counts.reposts} Pulse {previewPost.counts.pulses}</small>
                </div>
              </article>
              {previewPost.primaryCommunityNote ? (
                <div className={styles.previewNote}>
                  <strong>Catatan komunitas</strong>
                  <span>{previewPost.primaryCommunityNote.content}</span>
                </div>
              ) : null}
            </>
          ) : null}
          <div className={styles.previewMarket}>
            <strong>Market rail preview</strong>
            <svg viewBox="0 0 140 34" aria-hidden="true"><path d="M2 27 22 18 42 21 64 11 86 16 110 9 138 5" /></svg>
          </div>
        </div>
      </section>
      {marketGroups.length > 0 ? (
        <section className={styles.marketStrip} aria-label="Market preview">
          {marketGroups.map((group) => (
            <div className={styles.marketCard} key={group.title}>
              <strong>{group.title}</strong>
              {group.rows.slice(0, 3).map((row) => (
                <div key={row.symbol}>
                  <span>{row.symbol}</span>
                  <svg viewBox="0 0 92 26" aria-hidden="true" data-down={row.tone === 'down' ? 'true' : 'false'}>
                    <path d={row.tone === 'down' ? 'M2 8 18 13 34 12 50 20 68 17 90 24' : 'M2 22 18 15 34 18 52 10 70 14 90 7'} />
                  </svg>
                  <em>{row.change}</em>
                </div>
              ))}
            </div>
          ))}
        </section>
      ) : null}
      <section className={styles.products}>
        {[
          ['HERTZ', 'Social trading feed', '/hertz'],
          ['Outlook', 'WordPress market outlook', '/outlook'],
          ['Blog', 'WordPress imported articles', '/blog'],
          ['Tools', 'Trading research utilities', '/tools'],
        ].map(([title, text, href]) => (
          <Link href={href} key={href}>
            <strong>{title}</strong>
            <span>{text}</span>
            <em>{href}</em>
          </Link>
        ))}
      </section>
      <footer className={styles.footer}>Designed as the public face of Horizon. HERTZ is the social product inside it.</footer>
    </main>
  );
}
