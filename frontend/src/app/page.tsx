import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { HertzPostService } from '@shared/services/hertzPostService';
import type { HertzPost } from '@shared/types';
import { getMarketRailGroups } from '@/lib/globalDataMarket';
import type { MarketRailGroup } from '@/lib/globalDataMarket';
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
  const group = groups.find((g) => g.title === 'Forex Market');
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

function previewPostLine(post: HertzPost | null) {
  if (!post) return 'HERTZ feed aktif untuk setup, jurnal, dan diskusi member.';
  const handle = post.author.username ? `@${post.author.username}` : post.author.name;
  return `${handle}: ${post.content.text}`;
}

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
    text: 'Artikel panjang tetap nyaman dibaca untuk riset market mendalam.',
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

function TickerSparkline({ points, tone }: { points: number[]; tone: string }) {
  const path = buildSparklinePath(points, 56, 20);
  if (!path) return null;
  return (
    <svg className={styles.tickerSpark} viewBox="0 0 56 20" aria-hidden="true">
      <path d={path} data-down={tone === 'down' ? 'true' : 'false'} />
    </svg>
  );
}

function ProductVisual({ index }: { index: number }) {
  const patterns = [
    // HERTZ — network / feed icon
    <svg key="hertz" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="44" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="48" cy="44" r="5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="32" y1="26" x2="16" y2="39" stroke="currentColor" strokeWidth="1.2" />
      <line x1="32" y1="26" x2="48" y2="39" stroke="currentColor" strokeWidth="1.2" />
      <line x1="16" y1="44" x2="48" y2="44" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
    </svg>,
    // Outlook — compass / direction
    <svg key="outlook" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="32,14 36,30 32,28 28,30" fill="currentColor" opacity="0.6" />
      <polygon points="32,50 28,34 32,36 36,34" fill="currentColor" opacity="0.3" />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>,
    // Blog — document / article
    <svg key="blog" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="14" y="10" width="36" height="44" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="22" y1="22" x2="42" y2="22" stroke="currentColor" strokeWidth="1.2" />
      <line x1="22" y1="30" x2="42" y2="30" stroke="currentColor" strokeWidth="1.2" />
      <line x1="22" y1="38" x2="36" y2="38" stroke="currentColor" strokeWidth="1.2" />
      <rect x="22" y="14" width="12" height="3" rx="1" fill="currentColor" opacity="0.5" />
    </svg>,
    // Tools — sliders / utility
    <svg key="tools" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <line x1="16" y1="20" x2="48" y2="20" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="28" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="16" y1="32" x2="48" y2="32" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="40" cy="32" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="16" y1="44" x2="48" y2="44" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="22" cy="44" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>,
  ];
  return (
    <div className={styles.productVisual} style={{ color: 'var(--lp-accent)' }}>
      {patterns[index] ?? patterns[0]}
    </div>
  );
}

export default async function HorizonLanding() {
  const [previewPost, marketGroups] = await Promise.all([
    getLandingPreviewPost(),
    getLandingMarketGroups(),
  ]);

  const { group: forexGroup, heroAsset, supportingRows } = getForexHeroModel(marketGroups);
  const heroPath = buildSparklinePath(heroAsset?.sparkline ?? []);
  const heroArea = buildSparklineArea(heroAsset?.sparkline ?? []);

  return (
    <main className={styles.main}>
      {/* ---- Navbar ---- */}
      <header className={styles.navbar}>
        <Link className={styles.navBrand} href="/">
          <Image src="/images/logo/Logo-Horizon-Atom-Online-White_8.png" alt="" width={36} height={36} priority />
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

      {/* ---- Hero ---- */}
      <section className={styles.hero} aria-labelledby="horizon-market-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Premium forex workspace</p>
          <h1 id="horizon-market-title">Horizon Market Intelligence</h1>
          <p className={styles.lead}>
            Forex data, social trading flow, and market outlook in one focused workspace.
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

      {/* ---- Live Ticker Strip ---- */}
      {marketGroups.length > 0 ? (
        <section className={styles.tickerStrip} aria-label="Live market ticker">
          <div className={styles.tickerInner}>
            {marketGroups.map((group) => (
              <div className={styles.tickerGroup} key={group.title}>
                <div className={styles.tickerGroupLabel}>{group.title}</div>
                <div className={styles.tickerItems}>
                  {group.rows.slice(0, 6).map((row) => (
                    <div className={styles.tickerItem} key={row.symbol}>
                      <span className={styles.tickerSymbol}>{row.symbol}</span>
                      <span className={styles.tickerPrice}>{row.price}</span>
                      <em
                        className={styles.tickerChange}
                        data-down={row.tone === 'down' ? 'true' : 'false'}
                      >
                        {row.change}
                      </em>
                      <TickerSparkline points={row.sparkline} tone={row.tone} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---- Products — Zig-Zag ---- */}
      <section className={styles.products} aria-label="Horizon ecosystem">
        <div className={styles.socialProof}>
          <span className={styles.socialProofLabel}>Latest from HERTZ</span>
          <p>{previewPostLine(previewPost)}</p>
        </div>

        {productModules.map((item, index) => (
          <div className={styles.productRow} key={item.href}>
            <div className={styles.productText}>
              <span className={styles.productLabel}>{item.metric}</span>
              <strong className={styles.productTitle}>{item.title}</strong>
              <p className={styles.productDescription}>{item.text}</p>
              <Link className={styles.ctaLink} href={item.href}>
                Buka {item.title}
                <span className={styles.ctaArrow} aria-hidden="true">→</span>
              </Link>
            </div>
            <ProductVisual index={index} />
          </div>
        ))}
      </section>

      {/* ---- Final CTA ---- */}
      <section className={styles.ctaSection} aria-label="Get started">
        <div className={styles.ctaGlow} aria-hidden="true" />
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Mulai trading dengan Horizon</h2>
          <p className={styles.ctaDescription}>
            Data live, komunitas aktif, dan tools riset dalam satu tempat. Gratis untuk semua member.
          </p>
          <div className={styles.ctaActions}>
            <Link className={styles.primary} href="/hertz">Buka HERTZ</Link>
            <Link className={styles.secondary} href="/tools">Jelajahi Tools</Link>
          </div>
        </div>
      </section>

      {/* ---- Mobile Dock ---- */}
      <nav className={styles.mobileDock} aria-label="Horizon mobile navigation">
        <Link href="/hertz">HERTZ</Link>
        <Link href="/outlook">Outlook</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/tools">Tools</Link>
      </nav>

      {/* ---- Footer ---- */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Image src="/images/logo/Logo-Horizon-Atom-Online-White_8.png" alt="" width={22} height={22} />
            <strong>HORIZON</strong>
            <span>Market Intelligence</span>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/hertz">HERTZ</Link>
            <Link href="/outlook">Outlook</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/tools">Tools</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span className={styles.footerCopy}>© {new Date().getFullYear()} Horizon. All rights reserved.</span>
          <div className={styles.footerLegal}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
