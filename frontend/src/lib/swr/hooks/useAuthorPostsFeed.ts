'use client';

import { useCallback, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import type { HertzPost } from '@shared/types';
import { fetcher } from '../fetcher';

type FeedPage = { items: HertzPost[]; nextCursor: string | null };

export function useAuthorPostsFeed(params: {
  username: string;
  initialPosts: HertzPost[];
  initialNextCursor: string | null;
}) {
  const authorQuery = useMemo(
    () => `author=${encodeURIComponent(params.username)}`,
    [params.username],
  );

  const feedFetcher = useCallback(async (url: string) => fetcher<FeedPage>(url), []);

  const getKey = useCallback((pageIndex: number, previousPageData: FeedPage | null) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    if (pageIndex === 0) return `/api/hertz/posts?limit=20&${authorQuery}`;
    return `/api/hertz/posts?limit=20&${authorQuery}&cursor=${encodeURIComponent(previousPageData?.nextCursor ?? '')}`;
  }, [authorQuery]);

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<FeedPage>(
    getKey,
    feedFetcher,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      fallbackData: [{ items: params.initialPosts, nextCursor: params.initialNextCursor }],
    },
  );

  const posts = data?.flatMap((page) => page.items) ?? [];
  const hasReachedEnd = Boolean(data?.length && data[data.length - 1]?.nextCursor === null);

  return {
    posts,
    error,
    isLoadingInitialData: isLoading && !data,
    isLoadingMore: isValidating && size > 0 && Boolean(data?.length),
    hasReachedEnd,
    loadMore: useCallback(() => setSize((current) => current + 1), [setSize]),
    retry: useCallback(() => mutate(), [mutate]),
    mutate,
  };
}
