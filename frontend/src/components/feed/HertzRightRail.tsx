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

export function getHertzActivityIndicatorCopy({
  unreadCount,
  unreadDmCount,
}: {
  unreadCount: number;
  unreadDmCount: number;
}) {
  if (unreadCount > 0 || unreadDmCount > 0) {
    return {
      title: 'Aktivitas baru',
      body: `${unreadCount + unreadDmCount} update belum dibaca.`,
    };
  }
  return {
    title: 'Aktivitas',
    body: 'Belum ada aktivitas baru.',
  };
}

export function HertzRightRail({ activeSearch }: { activeSearch?: string | null }) {
  const [groups, setGroups] = useState<MarketRailGroup[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
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
      <MarketSidebarWidget groups={status === 'ready' ? groups : []} />
    </aside>
  );
}
