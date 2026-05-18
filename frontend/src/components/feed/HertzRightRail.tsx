'use client';

import { useEffect, useState } from 'react';
import type { MarketRailGroup } from '@/lib/globalDataMarket';
import { getHertzSearchEmptyState } from '@/lib/hertzSearchUi';
import { SearchIcon } from './HertzIcons';
import { MarketSidebarWidget } from './MarketSidebarWidget';
import styles from './HertzRails.module.css';

interface SearchResult {
  id: string;
  type: 'post' | 'member' | 'topic' | 'pair';
  label: string;
  description: string | null;
  href: string;
}

export function HertzRightRail({ activeSearch }: { activeSearch?: string | null }) {
  const [groups, setGroups] = useState<MarketRailGroup[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(activeSearch ?? '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'ready'>('idle');

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

  useEffect(() => {
    let cancelled = false;
    async function loadActivity() {
      const response = await fetch('/api/hertz/notifications/summary', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!cancelled && response.ok && payload?.success) {
        setUnreadDmCount(Number(payload.data.unreadDmCount ?? 0));
        setUnreadNotificationCount(Number(payload.data.unreadCount ?? 0));
      }
    }

    void loadActivity();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const text = searchQuery.trim();
    if (text.length < 2) {
      setSearchResults([]);
      setSearchStatus('idle');
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchStatus('loading');
      try {
        const response = await fetch(`/api/hertz/search?q=${encodeURIComponent(text)}`, {
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!controller.signal.aborted && response.ok && payload?.success) {
          setSearchResults(payload.data.results ?? []);
          setSearchStatus('ready');
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setSearchResults([]);
          setSearchStatus('ready');
        }
      }
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const emptyState = getHertzSearchEmptyState(searchQuery.trim());
  const activityCopy = getHertzActivityIndicatorCopy({ unreadCount: unreadNotificationCount, unreadDmCount });

  return (
    <aside className={styles.right} aria-label="Market intelligence">
      <form className={styles.searchBox} action="/hertz">
        <SearchIcon />
        <input
          name="q"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari pair, jurnal, atau member"
          aria-label="Cari HERTZ"
        />
      </form>
      {searchQuery.trim().length >= 2 ? (
        <div className={styles.searchResults} role="status">
          <div className={styles.panelHeader}>
            <strong>Social search</strong>
            <span>{searchStatus === 'loading' ? 'Mencari' : `${searchResults.length} hasil`}</span>
          </div>
          {searchResults.length > 0 ? searchResults.map((item) => (
            <a key={`${item.type}-${item.id}`} href={item.href}>
              <span>{item.type}</span>
              <strong>{item.label}</strong>
              {item.description ? <em>{item.description}</em> : null}
            </a>
          )) : (
            <p>{emptyState.body}</p>
          )}
        </div>
      ) : null}
      <div className={styles.activityCard}>
        <strong>{activityCopy.title}</strong>
        <span>{activityCopy.body}</span>
      </div>
      <MarketSidebarWidget groups={status === 'ready' ? groups : []} />
    </aside>
  );
}

export function getHertzActivityIndicatorCopy(input: number | { unreadCount?: number; unreadDmCount?: number }) {
  const unreadDmCount = typeof input === 'number' ? input : Number(input.unreadDmCount ?? 0);
  const unreadCount = typeof input === 'number' ? 0 : Number(input.unreadCount ?? 0);
  if (unreadCount > 0 && unreadDmCount > 0) {
    return { title: 'Aktivitas', body: `${unreadCount} notifikasi baru, termasuk ${unreadDmCount} DM.` };
  }
  if (unreadCount > 0) {
    return { title: 'Aktivitas', body: `${unreadCount} notifikasi baru.` };
  }
  if (unreadDmCount > 0) {
    return { title: 'Aktivitas', body: `${unreadDmCount} DM belum dibaca.` };
  }
  return { title: 'Aktivitas', body: 'Belum ada aktivitas baru.' };
}
