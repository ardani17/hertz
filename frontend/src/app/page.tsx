import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { HertzPostService } from '@shared/services/hertzPostService';
import type { HertzPost } from '@shared/types';
import { getMarketRailGroups } from '@/lib/globalDataMarket';
import type { MarketRailGroup, MarketRailRow } from '@/lib/globalDataMarket';
import styles from './HorizonLanding.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Horizon Market Intelligence',
  description: 'Premium forex market data, HERTZ social trading, Outlook, Blog, dan tools market dalam satu platform.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Horizon Market Intelligence',
    description: 'Forex market data, social trading flow, and market outlook in one focused workspace.',
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
    return await getMarketRailGroups();
  } catch {
    return [];
  }
}

function getForexHeroModel(groups: MarketRailGroup[]) {
  const group = groups.find((group) => group.title === 'Forex Market');
  const rows = group?.rows ?? [];
  const heroAsset = rows.find((row) => row.symbol === 'XAUUSD') ?? rows[0] ?? null;
  const supportingRows = rows.filter((row) => row.symbol !== heroAsset?.symbol).slice(0, 3);
  return { group, heroAsset, supportingRows };
}

function normalizeSparkline(points: number[], width = 640, height = 220) {
  const values = points.filter((point) => Number.isFinite(point));
  if (values.length < 2) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });
}

function buildSparklinePath(points: number[], width = 640, height = 220) {
  return normalizeSparkline(points, width, height)
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}

function buildSparklineArea(points: number[], width = 640, height = 220) {
  const normalized = normalizeSparkline(points, width, height);
  if (normalized.length < 2) return '';
  const line = normalized
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
  return `${line} L${width} ${height} L0 ${height} Z`;
}

function formatMarketUpdatedAt(value?: string) {
  if (!value) return 'Live market';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Live market';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

function marketToneLabel(row: MarketRailRow) {
  return row.tone === 'down' ? 'melemah' : 'menguat';
}

function previewPostLine(post: HertzPost | null) {
  if (!post) return 'HERTZ feed aktif untuk setup, jurnal, dan diskusi member.';
  const handle = post.author.username ? `@${post.author.username}` : post.author.name;
  return `${handle}: ${post.content.text}`;
}

export default async function HorizonLanding() {
  const [previewPost, marketGroups] = await Promise.all([
    getLandingPreviewPost(),
    getLandingMarketGroups(),
  ]);

  const { group: forexGroup, heroAsset, supportingRows } = getForexHeroModel(marketGroups);
  const heroPath = buildSparklinePath(heroAsset?.sparkline ?? []);
  const heroArea = buildSparklineArea(heroAsset?.sparkline ?? []);
  const visibleMarketGroups = marketGroups.slice(0, 3);
  const productModules = [
    {
      title: 'HERTZ',
      text: 'Social trading feed untuk setup, jurnal, DM, komentar, dan pulse member.',
      href: '/hertz',
      metric: 'Social trading',
    },
    {
      title: 'Outlook',
      text: 'Arah market dalam format video, artikel, screenshot chart, dan caption singkat.',
      href: '/outlook',
      metric: 'Market outlook',
    },
    {
      title: 'Blog',
      text: 'Artikel WordPress panjang tetap nyaman dibaca untuk riset market.',
      href: '/blog',
      metric: 'Longform research',
    },
    {
      title: 'Tools',
      text: 'Utility trading untuk riset cepat tanpa keluar dari ekosistem Horizon.',
      href: '/tools',
      metric: 'Research tools',
    },
  ];

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

      <section className={styles.hero} aria-labelledby="horizon-market-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Premium Forex Workspace</p>
          <h1 id="horizon-market-title">Horizon Market Intelligence</h1>
          <p className={styles.lead}>Forex data, social trading flow, and market outlook in one focused workspace.</p>
          <p className={styles.subcopy}>
            Pantau pergerakan forex utama dari GlobalData, baca arah market dari Outlook,
            lalu masuk ke HERTZ untuk mengikuti setup dan percakapan trader.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/hertz">Buka HERTZ</Link>
            <Link className={styles.secondary} href="/outlook">Lihat Outlook</Link>
          </div>
          <div className={styles.trustRow} aria-label="Horizon live data summary">
            <span>{forexGroup?.source.replace(/^GlobalData:\s*/, '') ?? 'GlobalData'}</span>
            <span>{heroAsset ? `Update ${formatMarketUpdatedAt(heroAsset.updatedAt)} WIB` : 'Market refresh'}</span>
            <span>{previewPost ? 'HERTZ feed live' : 'HERTZ ready'}</span>
          </div>
        </div>

        <aside className={styles.forexHero} aria-label="Live forex market preview">
          {heroAsset ? (
            <>
              <div className={styles.heroAssetTop}>
                <div>
                  <span className={styles.marketLabel}>Live forex</span>
                  <strong>{heroAsset.symbol}</strong>
                  <p>{heroAsset.symbol === 'XAUUSD' ? 'Gold / US Dollar' : 'Major forex pair'}</p>
                </div>
                <div className={styles.heroPrice}>
                  <strong>{heroAsset.price}</strong>
                  <em data-down={heroAsset.tone === 'down' ? 'true' : 'false'}>{heroAsset.change}</em>
                </div>
              </div>

              <div className={styles.chartFrame}>
                <svg className={styles.heroChart} viewBox="0 0 640 220" aria-hidden="true">
                  {heroArea ? (
                    <path
                      className={styles.chartArea}
                      d={heroArea}
                      data-down={heroAsset.tone === 'down' ? 'true' : 'false'}
                    />
                  ) : null}
                  {heroPath ? (
                    <path
                      className={styles.chartLine}
                      d={heroPath}
                      data-down={heroAsset.tone === 'down' ? 'true' : 'false'}
                    />
                  ) : null}
                </svg>
              </div>

              <div className={styles.forexStrip} aria-label="Major forex pairs">
                {supportingRows.map((row) => {
                  const miniPath = buildSparklinePath(row.sparkline, 140, 42);
                  return (
                    <div className={styles.forexTile} key={row.symbol}>
                      <span>{row.symbol}</span>
                      <strong>{row.price}</strong>
                      <em data-down={row.tone === 'down' ? 'true' : 'false'}>{row.change}</em>
                      {miniPath ? (
                        <svg viewBox="0 0 140 42" aria-hidden="true">
                          <path d={miniPath} data-down={row.tone === 'down' ? 'true' : 'false'} />
                        </svg>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className={styles.emptyMarket}>Forex market data sedang diperbarui.</div>
          )}
        </aside>
      </section>

      <section className={styles.marketShowcase} aria-label="Real market data preview">
        {visibleMarketGroups.length > 0 ? (
          visibleMarketGroups.map((group) => (
            <div className={styles.marketCard} key={group.title}>
              <div className={styles.marketCardHeader}>
                <strong>{group.title}</strong>
                <span>{group.source.replace(/^GlobalData:\s*/, '')}</span>
              </div>
              {group.rows.slice(0, 4).map((row) => {
                const rowPath = buildSparklinePath(row.sparkline, 128, 36);
                return (
                  <div className={styles.marketRow} key={row.symbol}>
                    <span>{row.symbol}</span>
                    <strong>{row.price}</strong>
                    <em data-down={row.tone === 'down' ? 'true' : 'false'}>
                      {row.change}
                      <small>{marketToneLabel(row)}</small>
                    </em>
                    {rowPath ? (
                      <svg viewBox="0 0 128 36" aria-hidden="true">
                        <path d={rowPath} data-down={row.tone === 'down' ? 'true' : 'false'} />
                      </svg>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className={styles.emptyMarket}>Market rail sedang disiapkan.</div>
        )}
      </section>

      <section className={styles.products} aria-label="Horizon ecosystem">
        <div className={styles.socialProof}>
          <span>Latest from HERTZ</span>
          <p>{previewPostLine(previewPost)}</p>
        </div>
        {productModules.map((item) => (
          <Link className={styles.productCard} href={item.href} key={item.href}>
            <span>{item.metric}</span>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </Link>
        ))}
      </section>

      <nav className={styles.mobileDock} aria-label="Horizon mobile navigation">
        <Link href="/hertz">HERTZ</Link>
        <Link href="/outlook">Outlook</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/tools">Tools</Link>
      </nav>

      <footer className={styles.footer}>
        Horizon menyatukan market intelligence, social trading, longform research, dan tools riset dalam satu platform.
      </footer>
    </main>
  );
}
