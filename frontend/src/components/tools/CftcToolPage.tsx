'use client';

import Link from 'next/link';
import { ToolNav } from './ToolNav';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

const pageCopy = {
  id: {
    eyebrow: 'Static Viewer',
    title: 'CFTC COT Viewer',
    description:
      'Baca snapshot Commitment of Traders untuk melihat positioning futures market dari kategori pelaku besar.',
    open: 'Buka viewer',
    guideTitle: 'Cara membaca CFTC COT Viewer',
    guideIntro:
      'COT adalah laporan mingguan positioning futures. Tool ini membantu membaca bias positioning, bukan sinyal entry otomatis.',
    snapshot: 'Snapshot statis',
    notLive: 'Tidak refresh live otomatis',
    summaryLabels: {
      report: 'Laporan',
      status: 'Status',
      mode: 'Mode',
    },
    statusNote:
      'Viewer ini cocok untuk membaca struktur laporan yang sudah tersedia di project. Untuk keputusan trading, tetap cocokkan dengan data COT terbaru.',
    quickTitle: 'Mulai dari market populer',
    quickLinks: [
      {
        href: '/tools/cftc-viewer/futures/financial-instruments/stock-indices/s%26p-broad-based-stock-indices/13874A/traders-in-financial-futures',
        label: 'S&P 500',
        detail: 'Traders in Financial Futures',
      },
      {
        href: '/tools/cftc-viewer/futures/financial-instruments/stock-indices/nasdaq--broadbased-indices/209742/traders-in-financial-futures',
        label: 'Nasdaq-100',
        detail: 'Traders in Financial Futures',
      },
      {
        href: '/tools/cftc-viewer/futures/natural-resources/petroleum-and-products/crude-oil/067651/disaggregated',
        label: 'Crude Oil',
        detail: 'Disaggregated',
      },
    ],
    cards: [
      {
        label: 'Fungsi',
        title: 'Untuk apa?',
        body:
          'Dipakai untuk riset sentimen dan positioning. COT membantu melihat apakah hedger, institusi, spekulan, atau non-reportable traders sedang condong long atau short.',
        points: ['Weekly COT', 'Market positioning', 'Futures research'],
      },
      {
        label: 'Report',
        title: 'Jenis data',
        body:
          'Viewer memetakan Legacy, Disaggregated, dan Traders in Financial Futures. Setiap format punya kategori trader yang berbeda.',
        points: ['Legacy', 'Disaggregated', 'TFF'],
      },
    ],
    categoriesTitle: 'Kategori utama',
    categoriesDescription: 'Pilih kategori report, lalu lanjutkan ke market dan format laporan yang ingin dibaca.',
    categories: [
      {
        href: '/tools/cftc-viewer/futures/financial-instruments',
        label: 'Kategori',
        title: 'Financial instruments',
        body: 'Stock indices, bonds, currencies, dan financial futures lain.',
      },
      {
        href: '/tools/cftc-viewer/futures/agriculture',
        label: 'Kategori',
        title: 'Agriculture',
        body: 'Grains, softs, dairy, livestock, dan komoditas pertanian.',
      },
      {
        href: '/tools/cftc-viewer/futures/natural-resources',
        label: 'Kategori',
        title: 'Natural resources',
        body: 'Energy, petroleum products, metals, dan resource futures.',
      },
    ],
  },
  en: {
    eyebrow: 'Static Viewer',
    title: 'CFTC COT Viewer',
    description:
      'Read a Commitment of Traders snapshot to inspect futures market positioning by major participant categories.',
    open: 'Open viewer',
    guideTitle: 'How to read the CFTC COT Viewer',
    guideIntro:
      'COT is a weekly futures positioning report. This tool helps inspect positioning bias, not automatic entry signals.',
    snapshot: 'Static snapshot',
    notLive: 'No automatic live refresh',
    summaryLabels: {
      report: 'Report',
      status: 'Status',
      mode: 'Mode',
    },
    statusNote:
      'This viewer is useful for reading the report structure available in the project. For trading decisions, compare it with the latest COT data.',
    quickTitle: 'Start from popular markets',
    quickLinks: [
      {
        href: '/tools/cftc-viewer/futures/financial-instruments/stock-indices/s%26p-broad-based-stock-indices/13874A/traders-in-financial-futures',
        label: 'S&P 500',
        detail: 'Traders in Financial Futures',
      },
      {
        href: '/tools/cftc-viewer/futures/financial-instruments/stock-indices/nasdaq--broadbased-indices/209742/traders-in-financial-futures',
        label: 'Nasdaq-100',
        detail: 'Traders in Financial Futures',
      },
      {
        href: '/tools/cftc-viewer/futures/natural-resources/petroleum-and-products/crude-oil/067651/disaggregated',
        label: 'Crude Oil',
        detail: 'Disaggregated',
      },
    ],
    cards: [
      {
        label: 'Function',
        title: 'What is it for?',
        body:
          'Use it for sentiment and positioning research. COT helps inspect whether hedgers, institutions, speculators, or non-reportable traders lean long or short.',
        points: ['Weekly COT', 'Market positioning', 'Futures research'],
      },
      {
        label: 'Report',
        title: 'Data types',
        body:
          'The viewer maps Legacy, Disaggregated, and Traders in Financial Futures reports. Each format has different trader categories.',
        points: ['Legacy', 'Disaggregated', 'TFF'],
      },
    ],
    categoriesTitle: 'Main categories',
    categoriesDescription: 'Choose a report category, then continue to the market and report format you want to inspect.',
    categories: [
      {
        href: '/tools/cftc-viewer/futures/financial-instruments',
        label: 'Category',
        title: 'Financial instruments',
        body: 'Stock indices, bonds, currencies, and other financial futures.',
      },
      {
        href: '/tools/cftc-viewer/futures/agriculture',
        label: 'Category',
        title: 'Agriculture',
        body: 'Grains, softs, dairy, livestock, and agricultural commodities.',
      },
      {
        href: '/tools/cftc-viewer/futures/natural-resources',
        label: 'Category',
        title: 'Natural resources',
        body: 'Energy, petroleum products, metals, and resource futures.',
      },
    ],
  },
};

export function CftcToolPage() {
  const { language } = useToolsLanguage();
  const copy = pageCopy[language];

  return (
    <main className={styles.shell}>
      <ToolNav />
      <section className={`${styles.header} ${styles.cftcHeader}`}>
        <div>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <div className={styles.cftcSummary}>
          <div className={`${styles.metric} ${styles.metricPrimary}`}>
            <span>{copy.summaryLabels.report}</span>
            <strong>COT</strong>
          </div>
          <div className={styles.metric}>
            <span>{copy.summaryLabels.status}</span>
            <strong>{copy.snapshot}</strong>
          </div>
          <div className={styles.metric}>
            <span>{copy.summaryLabels.mode}</span>
            <strong>{copy.notLive}</strong>
          </div>
        </div>
        <p className={styles.note}>{copy.statusNote}</p>
        <details className={styles.helpDetails}>
          <summary>{copy.guideTitle}</summary>
          <div className={styles.helpBody}>
            <p>{copy.guideIntro}</p>
            <div className={styles.helpGrid}>
              {copy.cards.map((card) => (
                <article className={styles.helpItem} key={card.title}>
                  <span className={styles.badgeMuted}>{card.label}</span>
                  <h2>{card.title}</h2>
                  <p>{card.body}</p>
                  <ul className={styles.inlineList}>
                    {card.points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </details>
        <div className={styles.actions}>
          <Link className="btn btn-primary" href="/tools/cftc-viewer">
            {copy.open}
          </Link>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{copy.categoriesTitle}</h2>
            <p>{copy.categoriesDescription}</p>
          </div>
        </div>
        <div className={styles.cftcQuickLinks} aria-label={copy.quickTitle}>
          <h3>{copy.quickTitle}</h3>
          <div className={styles.gridThree}>
            {copy.quickLinks.map((link) => (
              <Link className={styles.linkPanel} href={link.href} key={link.href}>
                <span className={styles.badgeMuted}>{link.detail}</span>
                <h3>{link.label}</h3>
              </Link>
            ))}
          </div>
        </div>
        <div className={styles.gridThree}>
          {copy.categories.map((category) => (
            <Link className={styles.linkPanel} href={category.href} key={category.href}>
              <span className={styles.badgeMuted}>{category.label}</span>
              <h3>{category.title}</h3>
              <p>{category.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
