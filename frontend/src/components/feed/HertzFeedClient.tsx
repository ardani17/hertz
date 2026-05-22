'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MemberSessionUser, HertzPostCategory } from '@shared/types';
import { hasHertzFeedQueryParams, parseHertzFeedCategory, type HertzFeedFilterPatch, type HertzFeedFilters } from '@/lib/hertzFeedFilters';
import { useLegacyQueryCleanup } from '@/lib/spa/useLegacyQueryCleanup';
import { HertzComposer } from './HertzComposer';
import { HertzHeader } from './HertzHeader';
import { HertzPostCard } from './HertzPost';
import { HertzPostCardSkeleton } from './HertzPostCardSkeleton';
import { getHertzFeedEmptyState } from '@/lib/hertzFeedUi';
import styles from './HertzFeedView.module.css';

import { useHertzFeed } from '@/lib/swr/hooks/useHertzFeed';

export function HertzFeedClient({
  currentUser,
  activeCategory,
  activeSearch,
  activeSort = 'latest',
}: {
  currentUser: MemberSessionUser | null;
  activeCategory?: HertzPostCategory | string | null;
  activeSearch?: string | null;
  activeSort?: 'latest' | 'trending';
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<HertzFeedFilters>({
    category: activeCategory ?? null,
    search: activeSearch ?? null,
    sort: activeSort,
  });

  const onHydrate = useCallback((params: URLSearchParams) => {
    setFilters({
      category: parseHertzFeedCategory(params.get('category')),
      search: params.get('q')?.trim() || null,
      sort: params.get('sort') === 'trending' ? 'trending' : 'latest',
    });
  }, []);

  useLegacyQueryCleanup({
    canonicalPath: '/hertz',
    shouldHydrate: hasHertzFeedQueryParams,
    onHydrate,
  });

  const updateFilters = useCallback((patch: HertzFeedFilterPatch) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const { posts, error, isLoadingInitialData, isLoadingMore, hasReachedEnd, loadMore, retry } = useHertzFeed({
    category: filters.category,
    search: filters.search,
    sort: filters.sort,
  });

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || hasReachedEnd) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasReachedEnd, loadMore]);

  const emptyCopy = getHertzFeedEmptyState({
    activeCategory: filters.category,
    activeSearch: filters.search,
  });

  return (
    <>
      <HertzHeader filters={filters} onFilterChange={updateFilters} />
      <HertzComposer currentUser={currentUser} filters={filters} onFilterChange={updateFilters} />
      <div className={styles.feed}>
        {isLoadingInitialData ? (
          Array.from({ length: 3 }).map((_, index) => <HertzPostCardSkeleton key={index} />)
        ) : posts.length > 0 ? (
          posts.map((post) => <HertzPostCard key={post.id} post={post} currentUser={currentUser} />)
        ) : (
          <div className={styles.empty} role="status">
            <h2>{emptyCopy.title}</h2>
            <p>{emptyCopy.body}</p>
          </div>
        )}
        {error ? (
          <button type="button" className={styles.retry} onClick={() => void retry()}>
            Coba lagi
          </button>
        ) : null}
        {isLoadingMore ? <HertzPostCardSkeleton /> : null}
        {!hasReachedEnd ? <div ref={sentinelRef} aria-hidden="true" /> : <p className={styles.endMarker}>Akhir timeline</p>}
      </div>
    </>
  );
}
