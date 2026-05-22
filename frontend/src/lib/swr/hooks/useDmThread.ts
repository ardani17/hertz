'use client';

import { useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';
import type { Message } from '@/features/hertz/messages/types';
import { fetcher } from '../fetcher';
import { useVisibilityRefreshInterval } from '../visibility';

type ThreadResponse = { messages: Message[]; isPartial?: boolean };

export function dmThreadKey(conversationId: string) {
  return `/api/hertz/messages/conversations/${conversationId}`;
}

export function useDmThread(conversationId: string | null) {
  const mergedRef = useRef<Message[]>([]);
  const refreshInterval = useVisibilityRefreshInterval(5_000);

  useEffect(() => {
    mergedRef.current = [];
  }, [conversationId]);

  const threadFetcher = useCallback(async (url: string): Promise<ThreadResponse> => {
    const after = mergedRef.current.at(-1)?.id;
    if (after) {
      const partial = await fetcher<ThreadResponse>(`${url}?after=${encodeURIComponent(after)}`);
      if (partial.messages.length > 0) {
        mergedRef.current = [...mergedRef.current, ...partial.messages];
      }
      return { messages: mergedRef.current, isPartial: true };
    }
    const full = await fetcher<ThreadResponse>(url);
    mergedRef.current = full.messages;
    return full;
  }, []);

  const { data, error, isLoading, mutate } = useSWR<ThreadResponse>(
    conversationId ? dmThreadKey(conversationId) : null,
    threadFetcher,
    { refreshInterval, revalidateOnFocus: true },
  );

  const resetThread = useCallback(() => {
    mergedRef.current = [];
    void mutate();
  }, [mutate]);

  return {
    messages: data?.messages ?? [],
    error,
    isLoading: isLoading && !data,
    mutate,
    resetThread,
  };
}
