import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { HertzPostService } from '@shared/services/hertzPostService';
import type { HertzPost } from '@shared/types';
import { getMarketRailGroups } from '@/lib/globalDataMarket';
import type { MarketRailGroup } from '@/lib/globalDataMarket';
import FaqAccordion from './FaqAccordion';
import styles from './HorizonLanding.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Horizon — Everything a Forex Trader Needs. One Platform.',
  description: 'Live market data, trade journaling, daily analysis, and research tools — all in one place. Free forever, no credit card required.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Horizon — Everything a Forex Trader Needs. One Platform.',
    description: 'Live market data, trade journaling, daily analysis, and research tools — all in one place. Free forever, no credit card required.',
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

function previewPostLine(post: HertzPost | null) {
  if (!post) return 'HERTZ feed aktif untuk setup, jurnal, dan diskusi member.';
  const handle = post.author.username ? `@${post.author.username}` : post.author.name;
  return `${handle}: ${post.content.text}`;
}

const productModules = [
  {
    title: 'HERTZ',
    text: 'Share setups, journal every trade, and learn from a community of active forex traders. Your trading diary — but social.',
    href: '/hertz',
    metric: 'Social trading',
    cta: 'Explore HERTZ →',
  },
  {
    title: 'Outlook',
    text: 'Daily market analysis with chart breakdowns, key levels, and bias calls. Know what to watch before the session opens.',
    href: '/outlook',
    metric: 'Market outlook',
    cta: "Read Today's Outlook →",
  },
  {
    title: 'Blog',
    text: 'In-depth research articles on forex strategy, risk management, and market structure. Go deeper than a Telegram signal.',
    href: '/blog',
    metric: 'Longform research',
    cta: 'Browse Articles →',
  },
  {
    title: 'Tools',
    text: 'Pivot points, profitability simulator, economic calendar, and more — free research tools that save you from opening 10 browser tabs.',
    href: '/tools',
    metric: 'Research tools',
    cta: 'Try Free Tools →',
  },
];

const faqItems = [
  {
    question: 'Is Horizon free?',
    answer: 'Yes, Horizon is completely free for all members. No credit card required, no hidden costs, no premium tiers.',
  },
  {
    question: 'Is Horizon a broker?',
    answer: 'No. Horizon is an independent market intelligence and community platform. We don\'t handle trades, deposits, or withdrawals.',
  },
  {
    question: 'Do I need to connect my trading account?',
    answer: 'No. Horizon works independently. We never ask for your broker credentials or MT4/MT5 login.',
  },
  {
    question: 'What is HERTZ?',
    answer: 'HERTZ is our social trading feed — think of it as a trading journal meets community. Share setups, post analysis, and learn from active forex traders.',
  },
  {
    question: 'What markets does Horizon cover?',
    answer: 'Horizon focuses primarily on forex pairs including majors, minors, and exotics. We also cover gold (XAUUSD) and key indices.',
  },
  {
    question: 'How do I get started?',
    answer: "Simply click 'Join Free' and create your account with Telegram. It takes less than 30 seconds.",
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

  const { heroAsset, supportingRows } = getForexHeroModel(marketGroups);
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
        <Link className={styles.login} href="/hertz">Sign In</Link>
      </header>

      {/* ---- Hero ---- */}
      <section className={styles.hero} aria-labelledby="horizon-market-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Free forex workspace for serious traders</p>
          <h1 id="horizon-market-title">Everything a Forex Trader Needs. One Platform.</h1>
          <p className={styles.lead}>
            Live market data, trade journaling, daily analysis, and research tools — all in one place. Stop switching between 5 apps. Start trading with clarity.
          </p>
          <div className={styles.actions}>
            <div className={styles.ctaPrimaryWrap}>
              <Link className={styles.primary} href="/hertz">Join Free — No Credit Card</Link>
              <span className={styles.microcopy}>Takes 30 seconds. Free forever.</span>
            </div>
            <Link className={styles.secondary} href="/outlook">See How It Works</Link>
          </div>
          <div className={styles.trustRow} aria-label="Horizon live data summary">
            <span>Live Forex Data</span>
            <span>Free to Join</span>
            <span>{previewPost ? 'Active Community' : 'Active Community'}</span>
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

      {/* ---- How It Works ---- */}
      <section className={styles.howItWorks} aria-label="How it works">
        <div className={styles.howItWorksContent}>
          <p className={styles.eyebrow}>Simple as 1-2-3</p>
          <h2>From zero to trading smarter in 3 steps</h2>
          <div className={styles.howItWorksGrid}>
            <div className={styles.howCard}>
              <span className={styles.howCardNumber}>1</span>
              <strong className={styles.howCardTitle}>Sign Up Free</strong>
              <p className={styles.howCardDesc}>Create your account in 30 seconds. No credit card, no broker integration needed.</p>
            </div>
            <div className={styles.howCard}>
              <span className={styles.howCardNumber}>2</span>
              <strong className={styles.howCardTitle}>Explore Market Data</strong>
              <p className={styles.howCardDesc}>Live forex pairs, daily outlook, and analysis tools — everything updates in real-time.</p>
            </div>
            <div className={styles.howCard}>
              <span className={styles.howCardNumber}>3</span>
              <strong className={styles.howCardTitle}>Join the Community</strong>
              <p className={styles.howCardDesc}>Share setups, journal trades, and learn from active traders on HERTZ.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Products — Zig-Zag ---- */}
      <section className={styles.products} aria-label="Horizon ecosystem">
        <div className={styles.socialProof}>
          <span className={styles.socialProofLabel}>What traders are saying on HERTZ</span>
          <p>{previewPostLine(previewPost)}</p>
        </div>

        {productModules.map((item, index) => (
          <div className={styles.productRow} key={item.href}>
            <div className={styles.productText}>
              <span className={styles.productLabel}>{item.metric}</span>
              <strong className={styles.productTitle}>{item.title}</strong>
              <p className={styles.productDescription}>{item.text}</p>
              <Link className={styles.ctaLink} href={item.href}>
                {item.cta}
              </Link>
            </div>
            <ProductVisual index={index} />
          </div>
        ))}
      </section>

      {/* ---- Testimonials ---- */}
      <section className={styles.testimonials} aria-label="Trader testimonials">
        <div className={styles.testimonialsContent}>
          <p className={styles.eyebrow}>Trusted by traders</p>
          <h2>What traders are saying</h2>
          <div className={styles.testimonialsGrid}>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialAvatar}>R</div>
              <blockquote className={styles.testimonialQuote}>
                &ldquo;Finally stopped switching between TradingView and Telegram. Everything I need is in one place now.&rdquo;
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <strong>Rizky P.</strong>
                <span>Swing Trader</span>
              </div>
            </div>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialAvatar}>A</div>
              <blockquote className={styles.testimonialQuote}>
                &ldquo;The daily outlook saves me at least an hour of prep time every morning. Key levels are always on point.&rdquo;
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <strong>Andi S.</strong>
                <span>Day Trader</span>
              </div>
            </div>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialAvatar}>D</div>
              <blockquote className={styles.testimonialQuote}>
                &ldquo;Journaling trades on HERTZ changed my consistency. Being able to look back at setups helps me avoid the same mistakes.&rdquo;
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <strong>Dimas W.</strong>
                <span>Scalper</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- FAQ Accordion ---- */}
      <section className={styles.faq} aria-label="Frequently asked questions">
        <div className={styles.faqContent}>
          <p className={styles.eyebrow}>Common questions</p>
          <h2>Frequently Asked Questions</h2>
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className={styles.ctaSection} aria-label="Get started">
        <div className={styles.ctaGlow} aria-hidden="true" />
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Trade with More Clarity?</h2>
          <p className={styles.ctaDescription}>
            Join thousands of forex traders who use Horizon to stay informed, journal their trades, and make better decisions. Free forever — no hidden costs.
          </p>
          <div className={styles.ctaActions}>
            <Link className={styles.primary} href="/hertz">Get Started Free</Link>
            <Link className={styles.secondary} href="/tools">See What's Included</Link>
          </div>
          <p className={styles.securityReassurance}>
            🔒 Your data stays private. No broker integration required. We never ask for trading account credentials.
          </p>
        </div>
      </section>

      {/* ---- Mobile Dock ---- */}
      <nav className={styles.mobileDock} aria-label="Horizon mobile navigation">
        <Link href="/hertz">HERTZ</Link>
        <Link href="/outlook">Outlook</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/tools">Tools</Link>
        <Link className={styles.mobileDockLogin} href="/hertz">Sign In</Link>
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
        <div className={styles.footerMid}>
          <p className={styles.footerAbout}>Horizon is a free forex market intelligence platform built for traders who want better tools and a stronger community.</p>
          <a
            className={styles.footerTelegram}
            href="https://t.me/horizon_forex"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join our Telegram Community →
          </a>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomLeft}>
            <span className={styles.footerCopy}>© {new Date().getFullYear()} Horizon. All rights reserved.</span>
            <span className={styles.footerBuilt}>Built with ❤ for the forex community</span>
          </div>
          <div className={styles.footerLegal}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
