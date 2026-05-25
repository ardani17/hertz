'use client';

import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { fetcher } from './fetcher';

function swrIsVisible() {
  if (typeof document === 'undefined') return true;
  return document.visibilityState !== 'hidden';
}

export function HertzSWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        dedupingInterval: 2_000,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        keepPreviousData: true,
        shouldRetryOnError: false,
        isVisible: swrIsVisible,
      }}
    >
      {children}
    </SWRConfig>
  );
}
