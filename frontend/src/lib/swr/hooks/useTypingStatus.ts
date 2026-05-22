'use client';

import useSWR from 'swr';
import { fetcher } from '../fetcher';
import { useVisibilityRefreshInterval } from '../visibility';

type TypingUser = { userId: string; displayName: string; lastTypingAt?: number };

export function useTypingStatus(conversationId: string | null, enabled = true) {
  const refreshInterval = useVisibilityRefreshInterval(4_000);
  return useSWR<{ typingUsers: TypingUser[] }>(
    enabled && conversationId ? `/api/hertz/messages/conversations/${conversationId}/typing` : null,
    fetcher,
    { refreshInterval, shouldRetryOnError: false },
  );
}
