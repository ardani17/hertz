'use client';

import { useEffect, useState } from 'react';
import type { MarketRailGroup, MarketTone } from '@/lib/globalDataMarket';
import { SearchIcon, PulseIcon } from './HertzIcons';
import styles from './HertzRails.module.css';

function buildSparklinePath(points: number[] | undefined, tone: MarketTone) {
  const values = points && points.length >= 2
    ? points.filter((point) => Number.isFinite(point))
    : tone === 'down'
      ? [5, 4.7, 4.9, 4.3, 4.5, 3.8, 3.5]
      : [3.5, 3.8, 3.7, 4.2, 4, 4.7, 5];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 94;
  const height = 30;
  const pad = 3;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * (width - pad * 2) + pad;
      const y = height - pad - ((value - min) / range) * (height - pad * 2);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function Sparkline({ tone, points }: { tone: MarketTone; points?: number[] }) {
  const d = buildSparklinePath(points, tone);
  return (
    <svg className={styles.sparkline} viewBox="0 0 94 30" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function formatUpdatedAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export function HertzRightRail({ activeSearch }: { activeSearch?: string | null }) {
  const [groups, setGroups] = useState<MarketRailGroup[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadMarketRail() {
      try {
        const response = await fetch('/api/market/rail');
        const payload = await response.json();
        if (cancelled) return;
        const nextGroups = Array.isArray(payload?.data?.groups) ? payload.data.groups : [];
        setGroups(nextGroups);
        setStatus(response.ok && nextGroups.length > 0 ? 'ready' : 'error');
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    }

    loadMarketRail();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className={styles.right} aria-label="Market intelligence">
      <form className={styles.searchBox} action="/hertz">
        <SearchIcon />
        <input name="q" defaultValue={activeSearch ?? ''} placeholder="Cari pair, jurnal, atau member" aria-label="Cari HERTZ" />
      </form>
      {status === 'loading' ? (
        <section className={styles.marketPanel}>
          <div className={styles.marketTitle}>
            <PulseIcon />
            <span>Market Data</span>
          </div>
          <p className={styles.marketEmpty}>Memuat data market...</p>
        </section>
      ) : null}
      {status === 'error' ? (
        <section className={styles.marketPanel}>
          <div className={styles.marketTitle}>
            <PulseIcon />
            <span>Market Data</span>
          </div>
          <p className={styles.marketEmpty}>Data market belum tersedia.</p>
        </section>
      ) : null}
      {status === 'ready' ? groups.map((group) => (
        <section className={styles.marketPanel} key={group.title}>
          <div className={styles.marketTitle}>
            <PulseIcon />
            <span>{group.title}</span>
          </div>
          {group.rows.map((row) => (
            <div className={styles.marketRow} key={row.symbol}>
              <strong>{row.symbol}</strong>
              <Sparkline tone={row.tone} points={row.sparkline} />
              <div>
                <b>{row.price}</b>
                <em className={row.tone === 'down' ? styles.down : styles.up}>{row.change}</em>
              </div>
            </div>
          ))}
          <p className={styles.marketSource}>
            {group.source}{formatUpdatedAt(group.updatedAt) ? ` · Update ${formatUpdatedAt(group.updatedAt)} WIB` : ''}
          </p>
        </section>
      )) : null}
    </aside>
  );
}
