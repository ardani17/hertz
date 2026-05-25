'use client';

import { useCallback, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import type { HertzPost } from '@shared/types';
import { fetcher } from '../fetcher';
import { useVisibilityRefreshInterval } from '../visibility';

type FeedPage = { items: HertzPost[]; nextCursor: string | null };

export function useHertzFeed(params: {
  category?: string | null;
  search?: string | null;
  sort?: 'latest' | 'trending';
}) {
  const refreshInterval = useVisibilityRefreshInterval(0);
  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('q', params.search);
    if (params.sort) query.set('sort', params.sort);
    return query.toString();
  }, [params.category, params.search, params.sort]);

  const feedFetcher = useCallback(async (url: string) => {
    return fetcher<FeedPage>(url);
  }, []);

  const getKey = useCallback((pageIndex: number, previousPageData: FeedPage | null) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    const suffix = queryString ? `&${queryString}` : '';
    if (pageIndex === 0) return `/api/hertz/posts?limit=20${suffix}`;
    return `/api/hertz/posts?limit=20${suffix}&cursor=${encodeURIComponent(previousPageData?.nextCursor ?? '')}`;
  }, [queryString]);

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<FeedPage>(
    getKey,
    feedFetcher,
    { revalidateOnFocus: true, refreshInterval, revalidateFirstPage: false },
  );

  const posts = data?.flatMap((page) => page.items) ?? [];
  const hasReachedEnd = Boolean(data?.length && data[data.length - 1]?.nextCursor === null);
  return {
    posts,
    error,
    isLoadingInitialData: isLoading && !data,
    isLoadingMore: isValidating && size > 0,
    hasReachedEnd,
    loadMore: useCallback(() => setSize((current) => current + 1), [setSize]),
    retry: useCallback(() => mutate(), [mutate]),
    mutate,
  };
}
