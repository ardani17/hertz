'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { replaceCanonicalPath } from './canonicalUrl';

/**
 * Reads legacy query params once, applies them via `onHydrate`, then cleans the URL to `canonicalPath`.
 */
export function useLegacyQueryCleanup({
  canonicalPath,
  shouldHydrate,
  onHydrate,
}: {
  canonicalPath: string;
  shouldHydrate: (search: string) => boolean;
  onHydrate: (params: URLSearchParams) => void;
}): void {
  const router = useRouter();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    const search = window.location.search;
    if (!shouldHydrate(search)) return;
    hydratedRef.current = true;
    onHydrate(new URLSearchParams(search.startsWith('?') ? search.slice(1) : search));
    replaceCanonicalPath(canonicalPath);
    router.replace(canonicalPath, { scroll: false });
  }, [canonicalPath, onHydrate, router, shouldHydrate]);
}
