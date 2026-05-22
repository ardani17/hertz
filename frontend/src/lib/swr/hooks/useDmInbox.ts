'use client';

import type { DmFilter } from '@/features/hertz/messages/types';
import { useResource } from './useResource';

export const dmInboxKey = (filter: DmFilter) => `/api/hertz/messages/inbox${filter === 'archived' ? '?archived=1' : ''}`;

export function useDmInbox<T = unknown>(filter: DmFilter, enabled = true) {
  return useResource<T>(enabled ? dmInboxKey(filter) : null, { refreshIntervalMs: 10_000 });
}
