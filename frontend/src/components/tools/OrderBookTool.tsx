'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

type BookType = 'ORDER' | 'POSITION';

type Bucket = {
  price: number;
  longCountPercent: number;
  shortCountPercent: number;
};

type OrderBookData = {
  bucketWidth: number;
  price: number;
  time: string;
  buckets: Bucket[];
};

type OrderBookResponse = {
  success?: boolean;
  error?: string;
  warning?: string;
  mode?: 'live' | 'demo';
  data?: {
    orderPositionBook?: OrderBookData[];
  };
};

const instruments = ['XAUUSD', 'XAGUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'EURJPY', 'GBPJPY'];

const copy = {
  id: {
    fields: {
      instrument: 'Instrumen',
      bookType: 'Tipe book',
      orders: 'Open Orders',
      positions: 'Open Positions',
      refresh: 'Refresh',
      loading: 'Loading...',
    },
    badges: {
      live: 'Live',
      demo: 'Demo fallback',
      order: 'Open Orders',
      position: 'Open Positions',
      jakarta: 'Waktu: Asia/Jakarta',
    },
    metrics: {
      price: 'Harga saat ini',
      bucketWidth: 'Lebar bucket',
      updated: 'Update',
      visibleRows: 'Level tampil',
    },
    table: {
      price: 'Price',
      long: 'Long %',
      short: 'Short %',
      empty: 'Belum ada data order book untuk pilihan ini.',
    },
    fallback:
      'Upstream order book sedang tidak tersedia, jadi distribusi demo ditampilkan agar layout dan pembacaan tool tetap bisa diuji.',
    note:
      'Fungsi: melihat konsentrasi order atau posisi di sekitar harga sekarang. Bar long/short membantu membaca area likuiditas potensial, bukan sinyal entry tunggal.',
    errors: {
      empty: 'Data order book kosong.',
      failed: 'Gagal mengambil order book.',
    },
  },
  en: {
    fields: {
      instrument: 'Instrument',
      bookType: 'Book type',
      orders: 'Open Orders',
      positions: 'Open Positions',
      refresh: 'Refresh',
      loading: 'Loading...',
    },
    badges: {
      live: 'Live',
      demo: 'Demo fallback',
      order: 'Open Orders',
      position: 'Open Positions',
      jakarta: 'Time: Asia/Jakarta',
    },
    metrics: {
      price: 'Current price',
      bucketWidth: 'Bucket width',
      updated: 'Updated',
      visibleRows: 'Visible levels',
    },
    table: {
      price: 'Price',
      long: 'Long %',
      short: 'Short %',
      empty: 'No order book data for this selection yet.',
    },
    fallback:
      'The order book upstream is currently unavailable, so demo distribution is shown to keep the tool readable and testable.',
    note:
      'Function: reads order or position concentration around current price. Long/short bars help inspect potential liquidity areas, not a standalone entry signal.',
    errors: {
      empty: 'Order book data is empty.',
      failed: 'Failed to fetch order book.',
    },
  },
};

function formatPrice(value: number) {
  const decimals = Math.abs(value) >= 100 ? 2 : 5;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatTime(dateUtc: string) {
  return new Date(dateUtc).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

export function OrderBookTool() {
  const { language } = useToolsLanguage();
  const current = copy[language];
  const [instrument, setInstrument] = useState('XAUUSD');
  const [bookType, setBookType] = useState<BookType>('ORDER');
  const [data, setData] = useState<OrderBookData | null>(null);
  const [mode, setMode] = useState<'live' | 'demo' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);
    setWarning(null);

    fetch('/api/tools/order-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instrument, bookType, recentHours: 1 }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || json.error) {
          throw new Error(json.error ?? current.errors.failed);
        }
        return json as OrderBookResponse;
      })
      .then((json) => {
        const book = json.data?.orderPositionBook?.[0];
        if (!book) throw new Error(current.errors.empty);
        setData(book);
        setMode(json.mode ?? (json.warning ? 'demo' : 'live'));
        setWarning(json.warning ? current.fallback : null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message || current.errors.failed);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [bookType, current.errors.empty, current.errors.failed, current.fallback, instrument]);

  useEffect(() => fetchData(), [fetchData]);

  const rows = useMemo(() => {
    if (!data) return [];
    const range = instrument.startsWith('XA') ? 60 : 0.01;
    return data.buckets
      .filter((bucket) => Math.abs(bucket.price - data.price) <= range)
      .sort((a, b) => b.price - a.price)
      .slice(0, 120);
  }, [data, instrument]);

  const max = Math.max(...rows.map((row) => Math.max(row.longCountPercent, row.shortCountPercent)), 1);

  return (
    <section className={styles.panel}>
      <div className={styles.formGridThree}>
        <div className={styles.field}>
          <label htmlFor="instrument">{current.fields.instrument}</label>
          <select id="instrument" value={instrument} onChange={(e) => setInstrument(e.target.value)}>
            {instruments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="bookType">{current.fields.bookType}</label>
          <select id="bookType" value={bookType} onChange={(e) => setBookType(e.target.value as BookType)}>
            <option value="ORDER">{current.fields.orders}</option>
            <option value="POSITION">{current.fields.positions}</option>
          </select>
        </div>
        <div className={styles.actions}>
          <button className="btn btn-primary" onClick={fetchData} type="button" disabled={loading}>
            {loading ? current.fields.loading : current.fields.refresh}
          </button>
        </div>
      </div>

      {data ? (
        <>
          <div className={styles.statusLine}>
            <span className={mode === 'demo' ? styles.badgeWarning : styles.badge}>
              {mode === 'demo' ? current.badges.demo : current.badges.live}
            </span>
            <span className={styles.badgeMuted}>{bookType === 'ORDER' ? current.badges.order : current.badges.position}</span>
            <span className={styles.badgeMuted}>{instrument}</span>
            <span className={styles.badgeMuted}>{current.badges.jakarta}</span>
          </div>
          <div className={styles.resultGrid}>
            <div className={`${styles.metric} ${styles.metricPrimary}`}>
              <span>{current.metrics.price}</span>
              <strong>{formatPrice(data.price)}</strong>
            </div>
            <div className={styles.metric}>
              <span>{current.metrics.bucketWidth}</span>
              <strong>{formatPrice(data.bucketWidth)}</strong>
            </div>
            <div className={styles.metric}>
              <span>{current.metrics.updated}</span>
              <strong>{formatTime(data.time)}</strong>
            </div>
            <div className={styles.metric}>
              <span>{current.metrics.visibleRows}</span>
              <strong>{rows.length.toLocaleString('id-ID')}</strong>
            </div>
          </div>
        </>
      ) : null}

      {error ? <div className={styles.error}>{error}</div> : null}
      {warning ? <p className={styles.note}>{warning}</p> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{current.table.price}</th>
              <th>{current.table.long}</th>
              <th>{current.table.short}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((bucket) => (
              <tr key={bucket.price}>
                <td>{formatPrice(bucket.price)}</td>
                <td>
                  <div className={styles.barTrack}>
                    <div className={styles.barLong} style={{ width: `${(bucket.longCountPercent / max) * 100}%` }} />
                  </div>
                  {bucket.longCountPercent.toFixed(2)}%
                </td>
                <td>
                  <div className={styles.barTrack}>
                    <div className={styles.barShort} style={{ width: `${(bucket.shortCountPercent / max) * 100}%` }} />
                  </div>
                  {bucket.shortCountPercent.toFixed(2)}%
                </td>
              </tr>
            )) : (
              <tr><td colSpan={3}><div className={styles.emptyState}>{current.table.empty}</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className={styles.note}>{current.note}</p>
    </section>
  );
}
