'use client';

import useSWR, { type SWRConfiguration } from 'swr';
import { useVisibilityRefreshInterval } from '../visibility';

export function useResource<T>(key: string | null, options: SWRConfiguration<T> & { refreshIntervalMs?: number } = {}) {
  const interval = useVisibilityRefreshInterval(options.refreshIntervalMs ?? 0);
  return useSWR<T>(key, {
    ...options,
    refreshInterval: interval,
  });
}
