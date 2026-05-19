'use client';

import Link from 'next/link';
import styles from '@/app/tools/tools.module.css';
import { ToolsLanguage, useToolsLanguage } from './useToolsLanguage';

type ToolCardCopy = {
  name: string;
  href: string;
  label: string;
  summary: string;
  points: string[];
};

const copy = {
  id: {
    eyebrow: 'Horizon Tools',
    title: 'Tool market untuk riset dan analisa komunitas.',
    lede: '',
    audit: 'Lihat audit migrasi HorizonFX V2',
    languageLabel: 'Bahasa tools',
    indonesia: 'Indonesia',
    english: 'English',
    aria: 'Pilih bahasa tools',
    tools: [
      {
        name: 'CFTC COT Viewer',
        href: '/tools/cftc',
        label: 'Static viewer',
        summary:
          'Viewer untuk membaca data Commitment of Traders dari CFTC, termasuk market futures agriculture, financial instruments, dan natural resources.',
        points: ['COT reports', 'Legacy, Disaggregated, TFF', 'Futures positioning'],
      },
      {
        name: 'Pivot Point Calculator',
        href: '/tools/pivot-point',
        label: 'Calculator',
        summary: 'Menghitung pivot, support, dan resistance dari data OHLC periode sebelumnya.',
        points: ['Pivot', 'Support', 'Resistance'],
      },
      {
        name: 'Profitability Simulator',
        href: '/tools/profitability',
        label: 'Simulator',
        summary: 'Simulasi Monte Carlo untuk membaca ekspektasi hasil trading dari risk, win rate, dan reward-risk.',
        points: ['Monte Carlo', 'Drawdown', 'ROI'],
      },
      {
        name: 'Challenge Tracker',
        href: '/tools/challenge-tracker',
        label: 'Tracker',
        summary: 'Pantau challenge trading nyata: target profit, drawdown, rules, jurnal manual, risk monitor, dan AI review context.',
        points: ['Member database', 'Journal & analytics', 'Risk monitor'],
      },
      {
        name: 'Elliott Wave Calculator',
        href: '/tools/elliott-wave',
        label: 'Calculator',
        summary: 'Membuat level Elliott berbasis range sebelumnya dan menandai area buy/sell observasi.',
        points: ['Fibonacci', 'Wave levels', 'Setups'],
      },
      {
        name: 'Economic Calendar',
        href: '/tools/economic-calendar',
        label: 'Live data',
        summary: 'Menampilkan event ekonomi medium dan high impact dari upstream calendar.',
        points: ['News events', 'Impact filter', 'Countries'],
      },
      {
        name: 'Order Book',
        href: '/tools/order-book',
        label: 'Live data',
        summary: 'Membaca distribusi open orders atau open positions dari OANDA Labs.',
        points: ['OANDA', 'Open orders', 'Positions'],
      },
      {
        name: 'Exchange Liquidity',
        href: '/tools/exchange-liquidity',
        label: 'Live data',
        summary: 'Melihat klaster likuidasi leverage crypto berdasarkan pair, exchange, dan timeframe.',
        points: ['Crypto', 'Liquidation map', 'Leverage'],
      },
      {
        name: 'HorizonFX V2 Audit',
        href: '/tools/horizonfx',
        label: 'Audit',
        summary:
          'Ringkasan apa saja yang ada di folder horizonfx-v2-main dan mana yang sudah dipindahkan menjadi tool aktif.',
        points: ['Audit', 'Migration map', 'Dependencies'],
      },
    ],
  },
  en: {
    eyebrow: 'Horizon Tools',
    title: 'Market tools for community research and analysis.',
    lede: '',
    audit: 'View HorizonFX V2 migration audit',
    languageLabel: 'Tools language',
    indonesia: 'Indonesia',
    english: 'English',
    aria: 'Choose tools language',
    tools: [
      {
        name: 'CFTC COT Viewer',
        href: '/tools/cftc',
        label: 'Static viewer',
        summary:
          'A viewer for reading CFTC Commitment of Traders data across agriculture, financial instruments, and natural resources futures markets.',
        points: ['COT reports', 'Legacy, Disaggregated, TFF', 'Futures positioning'],
      },
      {
        name: 'Pivot Point Calculator',
        href: '/tools/pivot-point',
        label: 'Calculator',
        summary: 'Calculates pivot, support, and resistance levels from the previous OHLC period.',
        points: ['Pivot', 'Support', 'Resistance'],
      },
      {
        name: 'Profitability Simulator',
        href: '/tools/profitability',
        label: 'Simulator',
        summary: 'Runs a Monte Carlo simulation to estimate trading outcomes from risk, win rate, and reward-risk.',
        points: ['Monte Carlo', 'Drawdown', 'ROI'],
      },
      {
        name: 'Challenge Tracker',
        href: '/tools/challenge-tracker',
        label: 'Tracker',
        summary: 'Track real trading challenges: profit target, drawdown, rules, manual journal, risk monitor, and AI review context.',
        points: ['Member database', 'Journal & analytics', 'Risk monitor'],
      },
      {
        name: 'Elliott Wave Calculator',
        href: '/tools/elliott-wave',
        label: 'Calculator',
        summary: 'Builds Elliott levels from the previous range and marks observational buy/sell areas.',
        points: ['Fibonacci', 'Wave levels', 'Setups'],
      },
      {
        name: 'Economic Calendar',
        href: '/tools/economic-calendar',
        label: 'Live data',
        summary: 'Shows medium and high impact economic events from the upstream calendar.',
        points: ['News events', 'Impact filter', 'Countries'],
      },
      {
        name: 'Order Book',
        href: '/tools/order-book',
        label: 'Live data',
        summary: 'Reads open orders or open positions distribution from OANDA Labs.',
        points: ['OANDA', 'Open orders', 'Positions'],
      },
      {
        name: 'Exchange Liquidity',
        href: '/tools/exchange-liquidity',
        label: 'Live data',
        summary: 'Shows crypto liquidation clusters by pair, exchange, and timeframe.',
        points: ['Crypto', 'Liquidation map', 'Leverage'],
      },
      {
        name: 'HorizonFX V2 Audit',
        href: '/tools/horizonfx',
        label: 'Audit',
        summary: 'A map of what exists in horizonfx-v2-main and what has been migrated into active tools.',
        points: ['Audit', 'Migration map', 'Dependencies'],
      },
    ],
  },
} satisfies Record<ToolsLanguage, {
  eyebrow: string;
  title: string;
  lede: string;
  audit: string;
  languageLabel: string;
  indonesia: string;
  english: string;
  aria: string;
  tools: ToolCardCopy[];
}>;

export function ToolsHub() {
  const { language, setLanguage } = useToolsLanguage();
  const current = copy[language];

  return (
    <div className={styles.main}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{current.eyebrow}</p>
          <h1>{current.title}</h1>
          {current.lede ? <p className={styles.lede}>{current.lede}</p> : null}
          <Link className={styles.auditLink} href="/tools/horizonfx">
            {current.audit}
          </Link>
        </div>

        <div className={styles.languagePanel} aria-label={current.aria}>
          <span>{current.languageLabel}</span>
          <div className={styles.languageToggle}>
            <button
              className={language === 'id' ? styles.languageActive : ''}
              onClick={() => setLanguage('id')}
              type="button"
            >
              {current.indonesia}
            </button>
            <button
              className={language === 'en' ? styles.languageActive : ''}
              onClick={() => setLanguage('en')}
              type="button"
            >
              {current.english}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.grid} aria-label="Daftar tools">
        {current.tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className={styles.toolCard}>
            <span className={styles.toolLabel}>{tool.label}</span>
            <h2>{tool.name}</h2>
            <p>{tool.summary}</p>
            <ul>
              {tool.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </Link>
        ))}
      </section>
    </div>
  );
}
