export type MarketTone = 'up' | 'down';

export interface MarketRailRow {
  symbol: string;
  price: string;
  change: string;
  tone: MarketTone;
  sparkline: number[];
  updatedAt?: string;
}

export interface MarketRailGroup {
  title: string;
  source: string;
  updatedAt?: string;
  rows: MarketRailRow[];
}

export interface MarketRailSnapshot {
  groups: MarketRailGroup[];
  generatedAt: string;
  expiresAt: string;
  cacheTtlSeconds: number;
  upstreamLatencyMs: number;
}

const GLOBALDATA_API_URL = process.env.GLOBALDATA_API_URL || 'http://globaldata-api:3201';
const MARKET_CACHE_TTL_MS = 20_000;

let marketRailCache: { snapshot: MarketRailSnapshot; expiresAtMs: number } | null = null;
let marketRailInFlight: Promise<MarketRailSnapshot> | null = null;

function formatPrice(value: unknown): string | null {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const decimals = Math.abs(number) >= 1000 ? 2 : Math.abs(number) >= 100 ? 2 : Math.abs(number) >= 10 ? 3 : 5;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

function formatChange(value: unknown): { change: string; tone: MarketTone } | null {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return {
    change: `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`,
    tone: number < 0 ? 'down' : 'up',
  };
}

function numeric(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function compactSparkline(values: Array<unknown>, fallback: MarketTone): number[] {
  const points = values.map(numeric).filter((value): value is number => value !== null);
  if (points.length >= 2) return points.slice(-12);
  return fallback === 'down' ? [5, 4.7, 4.9, 4.3, 4.5, 3.8, 3.5] : [3.5, 3.8, 3.7, 4.2, 4, 4.7, 5];
}

function latestIso(values: Array<string | undefined>): string | undefined {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

async function fetchGlobalData<T>(path: string): Promise<{ body: T; latencyMs: number } | null> {
  const url = new URL(path, GLOBALDATA_API_URL);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    return { body: (await response.json()) as T, latencyMs: Date.now() - startedAt };
  } catch {
    return null;
  }
}

function rowFromQuote(
  symbol: string,
  quote: Record<string, unknown> | null | undefined,
  sparklineValues: unknown[] = [],
): MarketRailRow | null {
  const price = formatPrice(quote?.price ?? quote?.rate ?? quote?.regularMarketPrice);
  const change = formatChange(quote?.changePercent ?? quote?.regularMarketChangePercent);
  if (!price || !change) return null;
  return {
    symbol,
    price,
    change: change.change,
    tone: change.tone,
    sparkline: compactSparkline(sparklineValues, change.tone),
    updatedAt: typeof quote?.fetchedAt === 'string' ? quote.fetchedAt : undefined,
  };
}

async function getXauRow(): Promise<MarketRailRow | null> {
  const data = await fetchGlobalData<{ success: boolean; data?: Array<{ close: number; datetime?: string }> }>(
    '/api/chart/price?symbol=OANDA:XAUUSD&timeframe=D&range=12',
  );
  const candles = Array.isArray(data?.body?.data) ? data.body.data : [];
  const latest = candles.at(-1)?.close;
  const previous = candles.at(-2)?.close;
  if (!latest || !previous) return null;
  const price = formatPrice(latest);
  const change = formatChange(((latest - previous) / previous) * 100);
  if (!price || !change) return null;
  return {
    symbol: 'XAUUSD',
    price,
    change: change.change,
    tone: change.tone,
    sparkline: compactSparkline(candles.map((candle) => candle.close), change.tone),
    updatedAt: candles.at(-1)?.datetime,
  };
}

async function getForexRow(pair: string, label: string): Promise<MarketRailRow | null> {
  const [quote, candles] = await Promise.all([
    fetchGlobalData<{ success: boolean; data?: { rate?: Record<string, unknown> } }>(`/api/v1/forex/${encodeURIComponent(pair)}`),
    fetchGlobalData<{ success: boolean; data?: Array<{ close: number; datetime?: string }> }>(
      `/api/chart/price?symbol=OANDA:${encodeURIComponent(pair)}&timeframe=D&range=12`,
    ),
  ]);
  const row = rowFromQuote(label, quote?.body?.data?.rate, (candles?.body?.data ?? []).map((candle) => candle.close));
  if (row && !row.updatedAt) row.updatedAt = (candles?.body?.data ?? []).at(-1)?.datetime;
  return row;
}

async function getCryptoRow(symbol: string, label: string): Promise<MarketRailRow | null> {
  const [quote, candles] = await Promise.all([
    fetchGlobalData<{ success: boolean; data?: { quote?: Record<string, unknown> } }>(`/api/v1/crypto/${encodeURIComponent(symbol)}`),
    fetchGlobalData<{ success: boolean; data?: Array<{ close: number; time?: string }> }>(
      `/api/v1/crypto/klines?symbol=${encodeURIComponent(symbol)}&interval=1h&limit=12`,
    ),
  ]);
  const row = rowFromQuote(label, quote?.body?.data?.quote, (candles?.body?.data ?? []).map((candle) => candle.close));
  if (row && !row.updatedAt) row.updatedAt = (candles?.body?.data ?? []).at(-1)?.time;
  return row;
}

async function getStockRow(symbol: string, label: string): Promise<MarketRailRow | null> {
  const [quote, candles] = await Promise.all([
    fetchGlobalData<{ success: boolean; data?: { quote?: Record<string, unknown> } }>(`/api/v1/stock/${encodeURIComponent(symbol)}`),
    fetchGlobalData<{ success: boolean; data?: Array<{ close: number; datetime?: string }> }>(
      `/api/chart/price?symbol=${encodeURIComponent(symbol)}&timeframe=D&range=12`,
    ),
  ]);
  const row = rowFromQuote(label, quote?.body?.data?.quote, (candles?.body?.data ?? []).map((candle) => candle.close));
  if (row && !row.updatedAt) row.updatedAt = (candles?.body?.data ?? []).at(-1)?.datetime;
  return row;
}

async function getIndexRows(): Promise<MarketRailRow[]> {
  const params = new URLSearchParams({ symbols: '^IXIC,^GSPC,^DJI' });
  const data = await fetchGlobalData<{ success: boolean; data?: Array<Record<string, unknown>> }>(`/api/v1/indices?${params.toString()}`);
  const labels: Record<string, string> = {
    '^IXIC': 'NASDAQ',
    '^GSPC': 'S&P 500',
    '^DJI': 'DOW',
  };

  const rows = await Promise.all((data?.body?.data ?? []).map(async (quote) => {
    const symbol = String(quote.symbol);
    const candles = await fetchGlobalData<{ success: boolean; data?: Array<{ close: number; datetime?: string }> }>(
      `/api/chart/price?symbol=${encodeURIComponent(symbol)}&timeframe=D&range=12`,
    );
    const row = rowFromQuote(labels[symbol] ?? symbol, quote, (candles?.body?.data ?? []).map((candle) => candle.close));
    if (row && !row.updatedAt) row.updatedAt = (candles?.body?.data ?? []).at(-1)?.datetime;
    return row;
  }));

  return rows.filter((row): row is MarketRailRow => Boolean(row));
}

function groupUpdatedAt(rows: MarketRailRow[]): string | undefined {
  return latestIso(rows.map((row) => row.updatedAt));
}

async function buildMarketRailSnapshot(): Promise<MarketRailSnapshot> {
  const startedAt = Date.now();
  const [xau, eur, gbp, jpy, btc, eth, sol, bnb, indices, tsla] = await Promise.all([
    getXauRow(),
    getForexRow('EURUSD', 'EURUSD'),
    getForexRow('GBPUSD', 'GBPUSD'),
    getForexRow('USDJPY', 'USDJPY'),
    getCryptoRow('BTCUSDT', 'BTC/USDT'),
    getCryptoRow('ETHUSDT', 'ETH/USDT'),
    getCryptoRow('SOLUSDT', 'SOL/USDT'),
    getCryptoRow('BNBUSDT', 'BNB/USDT'),
    getIndexRows(),
    getStockRow('TSLA', 'TSLA'),
  ]);

  const forexRows = [xau, eur, gbp, jpy].filter((row): row is MarketRailRow => Boolean(row));
  const cryptoRows = [btc, eth, sol, bnb].filter((row): row is MarketRailRow => Boolean(row));
  const stockRows = [...indices, tsla].slice(0, 4).filter((row): row is MarketRailRow => Boolean(row));
  const groups: MarketRailGroup[] = [
    {
      title: 'Forex Market',
      source: 'GlobalData: Yahoo Finance',
      updatedAt: groupUpdatedAt(forexRows),
      rows: forexRows,
    },
    {
      title: 'Crypto Market',
      source: 'GlobalData: Binance',
      updatedAt: groupUpdatedAt(cryptoRows),
      rows: cryptoRows,
    },
    {
      title: 'Stock Market',
      source: 'GlobalData: Yahoo Finance',
      updatedAt: groupUpdatedAt(stockRows),
      rows: stockRows,
    },
  ].filter((group) => group.rows.length > 0);

  const generatedAt = new Date().toISOString();
  return {
    groups,
    generatedAt,
    expiresAt: new Date(Date.now() + MARKET_CACHE_TTL_MS).toISOString(),
    cacheTtlSeconds: MARKET_CACHE_TTL_MS / 1000,
    upstreamLatencyMs: Date.now() - startedAt,
  };
}

export async function getMarketRailSnapshot(): Promise<MarketRailSnapshot> {
  const now = Date.now();
  if (marketRailCache && marketRailCache.expiresAtMs > now) {
    return marketRailCache.snapshot;
  }

  if (!marketRailInFlight) {
    marketRailInFlight = buildMarketRailSnapshot()
      .then((snapshot) => {
        marketRailCache = {
          snapshot,
          expiresAtMs: Date.now() + MARKET_CACHE_TTL_MS,
        };
        return snapshot;
      })
      .finally(() => {
        marketRailInFlight = null;
      });
  }

  return marketRailInFlight;
}

export async function getMarketRailGroups(): Promise<MarketRailGroup[]> {
  return (await getMarketRailSnapshot()).groups;
}
