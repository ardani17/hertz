import { describe, expect, it } from 'vitest';
import type { MarketRailGroup } from '../../../frontend/src/lib/globalDataMarket';
import {
  MARKET_SIDEBAR_CHART_HEIGHT,
  getMarketSidebarCards,
  marketSidebarFallbackGroups,
} from '../../../frontend/src/components/feed/MarketSidebarWidget';

const liveGroups: MarketRailGroup[] = [
  {
    title: 'Forex Market',
    source: 'GlobalData: Yahoo Finance',
    updatedAt: '2026-05-16T09:28:00.000Z',
    rows: [
      { symbol: 'XAUUSD', price: '4,555.80', change: '-2.61%', tone: 'down', sparkline: [5, 5.2, 5.1, 4.8] },
      { symbol: 'EURUSD', price: '1.16310', change: '-0.34%', tone: 'down', sparkline: [1, 1.1, 1.05, 1.02] },
      { symbol: 'GBPUSD', price: '1.33240', change: '-0.58%', tone: 'down', sparkline: [1.3, 1.34, 1.31] },
      { symbol: 'USDJPY', price: '158.73', change: '+0.24%', tone: 'up', sparkline: [157, 158, 158.73] },
    ],
  },
  {
    title: 'Crypto Market',
    source: 'GlobalData: Binance',
    updatedAt: '2026-05-16T09:28:00.000Z',
    rows: [
      { symbol: 'BTC/USDT', price: '78,015.99', change: '-3.09%', tone: 'down', sparkline: [80, 79, 78] },
      { symbol: 'ETH/USDT', price: '2,168.17', change: '-3.90%', tone: 'down', sparkline: [2.3, 2.2, 2.16] },
      { symbol: 'SOL/USDT', price: '85.800', change: '-5.90%', tone: 'down', sparkline: [90, 88, 85.8] },
      { symbol: 'BNB/USDT', price: '653.82', change: '-4.35%', tone: 'down', sparkline: [680, 660, 653] },
    ],
  },
  {
    title: 'Stock Market',
    source: 'GlobalData: Yahoo Finance',
    updatedAt: '2026-05-16T09:28:00.000Z',
    rows: [
      { symbol: 'NASDAQ', price: '26,225.15', change: '-1.54%', tone: 'down', sparkline: [27, 26.5, 26.2] },
      { symbol: 'S&P 500', price: '7,408.50', change: '-1.24%', tone: 'down', sparkline: [7.5, 7.4] },
      { symbol: 'DOW', price: '49,526.17', change: '-1.07%', tone: 'down', sparkline: [50, 49.5] },
      { symbol: 'TSLA', price: '422.24', change: '-4.75%', tone: 'down', sparkline: [440, 430, 422] },
    ],
  },
];

describe('HERTZ market sidebar widget data', () => {
  it('builds 3 compact cards with a main asset and 3 secondary rows each', () => {
    const cards = getMarketSidebarCards(liveGroups);

    expect(cards.map((card) => card.title)).toEqual(['Forex Market', 'Crypto Market', 'Stock Market']);
    expect(cards.every((card) => card.mainAsset.symbol.length > 0)).toBe(true);
    expect(cards.every((card) => card.secondaryAssets.length === 3)).toBe(true);
    expect(cards.every((card) => card.source.length > 0 && card.updatedAt)).toBe(true);
  });

  it('keeps chart height compact for a narrow right sidebar', () => {
    expect(MARKET_SIDEBAR_CHART_HEIGHT).toBeGreaterThanOrEqual(56);
    expect(MARKET_SIDEBAR_CHART_HEIGHT).toBeLessThanOrEqual(80);
  });

  it('provides realistic fallback data when live data is empty', () => {
    const cards = getMarketSidebarCards([]);

    expect(cards).toEqual(getMarketSidebarCards(marketSidebarFallbackGroups));
    expect(cards).toHaveLength(3);
    expect(cards[0].mainAsset.symbol).toBe('XAUUSD');
    expect(cards[1].mainAsset.symbol).toBe('BTC/USDT');
    expect(cards[2].mainAsset.symbol).toBe('NASDAQ');
  });
});
