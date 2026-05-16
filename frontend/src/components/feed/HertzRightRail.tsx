'use client';

import { useEffect, useState } from 'react';
import type { MarketRailGroup } from '@/lib/globalDataMarket';
import { SearchIcon } from './HertzIcons';
import { MarketSidebarWidget } from './MarketSidebarWidget';
import styles from './HertzRails.module.css';

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
      <MarketSidebarWidget groups={status === 'ready' ? groups : []} />
    </aside>
  );
}
