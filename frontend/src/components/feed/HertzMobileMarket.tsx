'use client';

import { useEffect, useState } from 'react';
import type { MarketRailGroup } from '@/lib/globalDataMarket';
import { PulseIcon } from './HertzIcons';
import styles from './HertzRails.module.css';

export function HertzMobileMarket() {
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
        if (!cancelled) setStatus('error');
      }
    }

    loadMarketRail();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.mobileMarket} aria-label="Data market mobile">
      <div className={styles.mobileMarketHeader}>
        <PulseIcon />
        <strong>Market</strong>
        <span>{status === 'loading' ? 'Memuat' : status === 'error' ? 'Tidak tersedia' : 'Live'}</span>
      </div>
      {status === 'ready' ? (
        <div className={styles.mobileMarketScroller}>
          {groups.flatMap((group) => group.rows.slice(0, 3).map((row) => (
            <div className={styles.mobileMarketItem} key={`${group.title}-${row.symbol}`}>
              <strong>{row.symbol}</strong>
              <span>{row.price}</span>
              <em className={row.tone === 'down' ? styles.down : styles.up}>{row.change}</em>
            </div>
          )))}
        </div>
      ) : (
        <p className={styles.mobileMarketEmpty}>Data market akan muncul saat koneksi tersedia.</p>
      )}
    </section>
  );
}
