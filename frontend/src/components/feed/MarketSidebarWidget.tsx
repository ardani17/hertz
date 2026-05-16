'use client';

import type { MarketRailGroup, MarketRailRow } from '@/lib/globalDataMarket';
import { MarketCard } from './MarketCard';
import styles from './MarketSidebarWidget.module.css';

export const MARKET_SIDEBAR_CHART_HEIGHT = 68;

export interface MarketSidebarAssetData extends MarketRailRow {
  description: string;
}

export interface MarketSidebarCardData {
  accent: 'forex' | 'crypto' | 'stock';
  title: 'Forex Market' | 'Crypto Market' | 'Stock Market';
  color: string;
  rgb: string;
  source: string;
  updatedAt?: string;
  mainAsset: MarketSidebarAssetData;
  secondaryAssets: MarketSidebarAssetData[];
}

const marketConfigs: Array<Pick<MarketSidebarCardData, 'accent' | 'title' | 'color' | 'rgb'>> = [
  { accent: 'forex', title: 'Forex Market', color: '#32f58a', rgb: '50, 245, 138' },
  { accent: 'crypto', title: 'Crypto Market', color: '#b568ff', rgb: '181, 104, 255' },
  { accent: 'stock', title: 'Stock Market', color: '#3b95ff', rgb: '59, 149, 255' },
];

const descriptions: Record<string, string> = {
  XAUUSD: 'Gold / US Dollar',
  EURUSD: 'Euro / US Dollar',
  GBPUSD: 'British Pound / US Dollar',
  USDJPY: 'US Dollar / Japanese Yen',
  'BTC/USDT': 'Bitcoin / Tether',
  'ETH/USDT': 'Ethereum / Tether',
  'SOL/USDT': 'Solana / Tether',
  'BNB/USDT': 'BNB / Tether',
  NASDAQ: 'NASDAQ Composite',
  'S&P 500': 'S&P 500 Index',
  DOW: 'Dow Jones Industrial',
  TSLA: 'Tesla Inc.',
};

export const marketSidebarFallbackGroups: MarketRailGroup[] = [
  {
    title: 'Forex Market',
    source: 'Yahoo Finance',
    updatedAt: '2026-05-16T09:28:00.000Z',
    rows: [
      { symbol: 'XAUUSD', price: '4,555.80', change: '-2.61%', tone: 'down', sparkline: [4650, 4662, 4644, 4630, 4618, 4590, 4555] },
      { symbol: 'EURUSD', price: '1.16310', change: '-0.34%', tone: 'down', sparkline: [1.168, 1.166, 1.167, 1.164, 1.163] },
      { symbol: 'GBPUSD', price: '1.33240', change: '-0.58%', tone: 'down', sparkline: [1.341, 1.338, 1.336, 1.333] },
      { symbol: 'USDJPY', price: '158.73', change: '+0.24%', tone: 'up', sparkline: [157.8, 158.1, 157.9, 158.5, 158.73] },
    ],
  },
  {
    title: 'Crypto Market',
    source: 'Binance',
    updatedAt: '2026-05-16T09:28:00.000Z',
    rows: [
      { symbol: 'BTC/USDT', price: '78,015.99', change: '-3.09%', tone: 'down', sparkline: [81100, 80400, 80220, 79000, 78550, 78015] },
      { symbol: 'ETH/USDT', price: '2,168.17', change: '-3.90%', tone: 'down', sparkline: [2260, 2230, 2214, 2188, 2168] },
      { symbol: 'SOL/USDT', price: '85.800', change: '-5.90%', tone: 'down', sparkline: [91.4, 89.2, 88.6, 86.9, 85.8] },
      { symbol: 'BNB/USDT', price: '653.82', change: '-4.35%', tone: 'down', sparkline: [684, 671, 665, 657, 653] },
    ],
  },
  {
    title: 'Stock Market',
    source: 'Yahoo Finance',
    updatedAt: '2026-05-16T09:28:00.000Z',
    rows: [
      { symbol: 'NASDAQ', price: '26,225.15', change: '-1.54%', tone: 'down', sparkline: [26890, 26740, 26680, 26420, 26225] },
      { symbol: 'S&P 500', price: '7,408.50', change: '-1.24%', tone: 'down', sparkline: [7520, 7488, 7472, 7420, 7408] },
      { symbol: 'DOW', price: '49,526.17', change: '-1.07%', tone: 'down', sparkline: [50100, 49980, 49860, 49620, 49526] },
      { symbol: 'TSLA', price: '422.24', change: '-4.75%', tone: 'down', sparkline: [446, 438, 431, 427, 422] },
    ],
  },
];

function withDescription(row: MarketRailRow): MarketSidebarAssetData {
  return {
    ...row,
    description: descriptions[row.symbol] ?? 'Live market instrument',
  };
}

function groupByTitle(groups: MarketRailGroup[], title: MarketSidebarCardData['title']) {
  return groups.find((group) => group.title === title && group.rows.length >= 4)
    ?? marketSidebarFallbackGroups.find((group) => group.title === title);
}

export function getMarketSidebarCards(groups: MarketRailGroup[]): MarketSidebarCardData[] {
  return marketConfigs.flatMap((config) => {
    const group = groupByTitle(groups, config.title);
    if (!group) return [];
    const rows = group.rows.slice(0, 4).map(withDescription);
    if (rows.length < 4) return [];
    return [{
      ...config,
      source: group.source.replace(/^GlobalData:\s*/, ''),
      updatedAt: group.updatedAt,
      mainAsset: rows[0],
      secondaryAssets: rows.slice(1, 4),
    }];
  });
}

export function MarketSidebarWidget({ groups }: { groups: MarketRailGroup[] }) {
  const cards = getMarketSidebarCards(groups);

  return (
    <div className={styles.widget} aria-label="Compact market sidebar">
      {cards.map((card) => (
        <MarketCard card={card} key={card.title} />
      ))}
    </div>
  );
}
