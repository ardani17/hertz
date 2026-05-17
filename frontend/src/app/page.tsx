import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { HertzPostService } from '@shared/services/hertzPostService';
import type { HertzPost } from '@shared/types';
import { getMarketRailGroups } from '@/lib/globalDataMarket';
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

async function getLandingPreviewPost(): Promise<HertzPost | null> {
  try {
    const feed = new HertzPostService();
    const result = await feed.listFeed({ limit: 1, sort: 'latest' });
    return result.items[0] ?? null;
  } catch {
    return null;
  }
}

async function getLandingMarketGroups() {
  try {
    return (await getMarketRailGroups()).slice(0, 2);
  } catch {
    return [];
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

function categoryInitials(post: HertzPost) {
  if (post.category === 'trading_room') return 'TR';
  if (post.category === 'life_coffee') return 'LC';
  return initials(post.author.name);
}

function categoryLabel(post: HertzPost) {
  if (post.category === 'trading_room' || post.category === 'trading') return 'Trading';
  if (post.category === 'life_coffee' || post.category === 'life_story') return 'Life';
  return 'General';
}

function authorHandle(post: HertzPost) {
  return post.author.username ? `@${post.author.username}` : '@hertzmember';
}

export default async function HorizonLanding() {
  const [previewPost, marketGroups] = await Promise.all([
    getLandingPreviewPost(),
    getLandingMarketGroups(),
  ]);

  const productModules = [
    {
      title: 'HERTZ',
      text: 'Social trading feed untuk setup, jurnal, DM, komentar, dan pulse member.',
      href: '/hertz',
      metric: 'Live social layer',
    },
    {
      title: 'Outlook',
      text: 'Arah market dalam format video, artikel, screenshot chart, dan caption singkat.',
      href: '/outlook',
      metric: 'Market direction',
    },
    {
      title: 'Blog',
      text: 'Artikel WordPress panjang tetap nyaman dibaca di tema Horizon.',
      href: '/blog',
      metric: 'Longform archive',
    },
    {
      title: 'Tools',
      text: 'Utility trading untuk riset cepat tanpa keluar dari ekosistem.',
      href: '/tools',
      metric: 'Research kit',
    },
  ];

  const firstMarketGroup = marketGroups[0];

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

      <section className={styles.hero} aria-labelledby="horizon-command-center-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Horizon Command Center</p>
          <h1 id="horizon-command-center-title">Horizon</h1>
          <p className={styles.lead}>Market, social, insight dalam satu workspace trading.</p>
          <p className={styles.subcopy}>
            Horizon menyatukan feed sosial HERTZ, Outlook market, Blog longform, dan Tools riset
            dalam satu pintu utama yang cepat dipindai sebelum masuk ke market.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/hertz">Buka HERTZ</Link>
            <Link className={styles.secondary} href="/outlook">Lihat Outlook</Link>
          </div>
          <div className={styles.signalGrid}>
            <div>
              <strong>Social</strong>
              <span>Posting, pulse, komentar, repost, dan DM member.</span>
            </div>
            <div>
              <strong>Insight</strong>
              <span>Outlook, blog panjang, dan screenshot chart tetap rapi.</span>
            </div>
            <div>
              <strong>Market</strong>
              <span>Rail GlobalData dan tools riset selalu dekat dengan feed.</span>
            </div>
          </div>
        </div>

        <aside className={styles.commandPanel} aria-label="Horizon command center preview">
          <div className={styles.panelHeader}>
            <Image src="/images/logo/Logo-Horizon-Atom-Online-White_8.png" alt="" width={34} height={34} />
            <div>
              <strong>Live Workspace</strong>
              <span>HERTZ activity, market rail, dan produk Horizon</span>
            </div>
          </div>

          <div className={styles.composerPreview}>Kirim jurnal, baca arah market, lalu cek tools dari satu workspace.</div>

          {previewPost ? (
            <article className={styles.activityCard}>
              <span className={styles.categoryBadge}>{categoryInitials(previewPost)}</span>
              <div className={styles.activityBody}>
                <div className={styles.activityMeta}>
                  <strong>{previewPost.author.name}</strong>
                  <span>{authorHandle(previewPost)}</span>
                  <em>{categoryLabel(previewPost)}</em>
                </div>
                <p>{previewPost.content.text}</p>
                <svg viewBox="0 0 260 52" aria-hidden="true">
                  <path d="M2 40 26 28 48 33 72 19 96 23 122 12 148 17 174 8 202 23 230 15 258 9" />
                </svg>
                <small>
                  Comment {previewPost.counts.comments} Repost {previewPost.counts.reposts} Pulse {previewPost.counts.pulses}
                </small>
              </div>
            </article>
          ) : (
            <div className={styles.emptyCard}>Aktivitas HERTZ terbaru akan muncul di sini.</div>
          )}

          <div className={styles.marketPreview}>
            <div>
              <span>Market rail</span>
              <strong>{firstMarketGroup?.title ?? 'GlobalData'}</strong>
            </div>
            <svg viewBox="0 0 140 34" aria-hidden="true">
              <path d="M2 27 22 18 42 21 64 11 86 16 110 9 138 5" />
            </svg>
          </div>

          <div className={styles.panelProducts}>
            {productModules.slice(1).map((item) => (
              <Link href={item.href} key={item.href}>
                <span>{item.title}</span>
                <strong>{item.metric}</strong>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.marketStrip} aria-label="Market preview">
        {marketGroups.length > 0 ? (
          marketGroups.map((group) => (
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
          ))
        ) : (
          <div className={styles.emptyCard}>Market rail sedang disiapkan.</div>
        )}
      </section>

      <section className={styles.products} aria-label="Horizon ecosystem">
        {productModules.map((item) => (
          <Link className={styles.productCard} href={item.href} key={item.href}>
            <span>{item.metric}</span>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
            <em>{item.href}</em>
          </Link>
        ))}
      </section>

      <nav className={styles.mobileDock} aria-label="Horizon mobile navigation">
        <Link href="/hertz">HERTZ</Link>
        <Link href="/outlook">Outlook</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/tools">Tools</Link>
      </nav>

      <footer className={styles.footer}>Horizon adalah pintu utama untuk social trading HERTZ, market outlook, blog, dan tools riset.</footer>
    </main>
  );
}
