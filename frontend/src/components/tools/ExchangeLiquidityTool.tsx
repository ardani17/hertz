'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

type LiquidityEntry = {
  liq_price: string[];
  liq_level: string[];
};

type ApiResponse = {
  success?: boolean;
  data?: {
    data?: {
      liq_10x_map_data?: { data: LiquidityEntry[] };
      liq_25x_map_data?: { data: LiquidityEntry[] };
      liq_50x_map_data?: { data: LiquidityEntry[] };
      liq_100x_map_data?: { data: LiquidityEntry[] };
      cur_price_data?: { data: Array<{ cur_price: string }> };
    };
  };
  error?: string;
};

type Row = {
  price: number;
  total: number;
};

const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];
const exchanges = ['Bi**ce', 'Gate', 'O**X', 'By**it'];
const timeTypes = ['1D', '7D', '30D'];

const copy = {
  id: {
    fields: {
      exchange: 'Exchange',
      pair: 'Pair',
      range: 'Range',
    },
    status: {
      live: 'Live',
      noStore: 'Fresh data',
    },
    metrics: {
      currentPrice: 'Harga saat ini',
      dataPoints: 'Level tampil',
      strongest: 'Level terkuat',
    },
    table: {
      price: 'Price',
      level: 'Liquidation level',
      empty: 'Belum ada liquidity data untuk kombinasi ini.',
    },
    loading: 'Memuat liquidity map...',
    error: 'Gagal mengambil liquidity map.',
    note:
      'Fungsi: membaca perkiraan klaster likuidasi leverage di sekitar harga crypto. Gunakan sebagai area observasi, bukan sinyal entry tunggal.',
  },
  en: {
    fields: {
      exchange: 'Exchange',
      pair: 'Pair',
      range: 'Range',
    },
    status: {
      live: 'Live',
      noStore: 'Fresh data',
    },
    metrics: {
      currentPrice: 'Current price',
      dataPoints: 'Visible levels',
      strongest: 'Strongest level',
    },
    table: {
      price: 'Price',
      level: 'Liquidation level',
      empty: 'No liquidity data for this combination yet.',
    },
    loading: 'Loading liquidity map...',
    error: 'Failed to fetch liquidity map.',
    note:
      'Function: reads estimated leveraged liquidation clusters around crypto price. Use it as an observation area, not a standalone entry signal.',
  },
};

function formatPrice(value: number) {
  const decimals = Math.abs(value) >= 100 ? 2 : 5;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatLevel(value: number) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function ExchangeLiquidityTool() {
  const { language } = useToolsLanguage();
  const current = copy[language];
  const [pair, setPair] = useState('BTC/USDT');
  const [exchange, setExchange] = useState('Bi**ce');
  const [timeType, setTimeType] = useState('1D');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ pair, exchange, timeType });
    setLoading(true);
    setError(null);

    fetch(`/api/tools/exchange-liquidity?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || json.error) {
          throw new Error(json.error ?? current.error);
        }
        return json as ApiResponse;
      })
      .then((json) => setData(json))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message || current.error);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [current.error, exchange, pair, timeType]);

  const currentPrice = Number(data?.data?.data?.cur_price_data?.data?.[0]?.cur_price ?? 0);
  const rows = useMemo<Row[]>(() => {
    const root = data?.data?.data;
    if (!root || !currentPrice) return [];
    const map = new Map<number, number>();
    [root.liq_10x_map_data, root.liq_25x_map_data, root.liq_50x_map_data, root.liq_100x_map_data].forEach((group) => {
      const entry = group?.data?.[0];
      entry?.liq_price?.forEach((price, index) => {
        const numericPrice = Number(price);
        const level = Number(entry.liq_level[index] ?? 0);
        if (Number.isFinite(numericPrice) && Number.isFinite(level) && level > 0) {
          map.set(numericPrice, (map.get(numericPrice) ?? 0) + level);
        }
      });
    });
    return Array.from(map.entries())
      .map(([price, total]) => ({ price, total }))
      .sort((a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice))
      .slice(0, 60);
  }, [currentPrice, data]);

  const max = Math.max(...rows.map((row) => row.total), 1);
  const strongest = rows.reduce<Row | null>((best, row) => (!best || row.total > best.total ? row : best), null);

  return (
    <section className={styles.panel}>
      <div className={styles.formGridThree}>
        <div className={styles.field}>
          <label htmlFor="exchange">{current.fields.exchange}</label>
          <select id="exchange" value={exchange} onChange={(e) => setExchange(e.target.value)}>
            {exchanges.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="pair">{current.fields.pair}</label>
          <select id="pair" value={pair} onChange={(e) => setPair(e.target.value)}>
            {pairs.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="timeType">{current.fields.range}</label>
          <select id="timeType" value={timeType} onChange={(e) => setTimeType(e.target.value)}>
            {timeTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      {loading ? <p className={styles.note}>{current.loading}</p> : null}
      {error ? <div className={styles.error}>{error}</div> : null}

      {currentPrice ? (
        <>
          <div className={styles.statusLine}>
            <span className={styles.badge}>{current.status.live}</span>
            <span className={styles.badgeMuted}>{current.status.noStore}</span>
            <span className={styles.badgeMuted}>{exchange}</span>
            <span className={styles.badgeMuted}>{pair} / {timeType}</span>
          </div>
          <div className={styles.resultGrid}>
            <div className={`${styles.metric} ${styles.metricPrimary}`}>
              <span>{current.metrics.currentPrice}</span>
              <strong>{formatPrice(currentPrice)}</strong>
            </div>
            <div className={styles.metric}>
              <span>{current.metrics.dataPoints}</span>
              <strong>{rows.length.toLocaleString('id-ID')}</strong>
            </div>
            <div className={`${styles.metric} ${styles.metricPrimary}`}>
              <span>{current.metrics.strongest}</span>
              <strong>{strongest ? formatPrice(strongest.price) : '-'}</strong>
            </div>
          </div>
        </>
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{current.table.price}</th>
              <th>{current.table.level}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.price}>
                <td>{formatPrice(row.price)}</td>
                <td>
                  <div className={styles.barTrack}>
                    <div className={styles.barLong} style={{ width: `${(row.total / max) * 100}%` }} />
                  </div>
                  {formatLevel(row.total)}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={2}><div className={styles.emptyState}>{current.table.empty}</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className={styles.note}>{current.note}</p>
    </section>
  );
}
