'use client';

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
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.search) query.set('q', params.search);
  if (params.sort) query.set('sort', params.sort);

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<FeedPage>(
    (pageIndex, previousPageData) => {
      if (previousPageData && !previousPageData.nextCursor) return null;
      const suffix = query.toString() ? `&${query.toString()}` : '';
      if (pageIndex === 0) return `/api/hertz/posts?limit=20${suffix}`;
      return `/api/hertz/posts?limit=20${suffix}&cursor=${encodeURIComponent(previousPageData?.nextCursor ?? '')}`;
    },
    fetcher,
    { revalidateOnFocus: true, refreshInterval },
  );

  const posts = data?.flatMap((page) => page.items) ?? [];
  const hasReachedEnd = Boolean(data?.length && data[data.length - 1]?.nextCursor === null);
  return {
    posts,
    error,
    isLoadingInitialData: isLoading && !data,
    isLoadingMore: isValidating && size > 0,
    hasReachedEnd,
    loadMore: () => setSize((current) => current + 1),
    retry: () => mutate(),
  };
}
