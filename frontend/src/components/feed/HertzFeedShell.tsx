'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { MemberSessionUser } from '@shared/types';
import {
  buildHertzPostPath,
  hasLegacyHertzPostQuery,
  parseHertzPostPathname,
  parseLegacyHertzPostQuery,
} from '@/lib/hertzPostSpa';
import { replaceCanonicalPath } from '@/lib/spa/canonicalUrl';
import { HertzPostDetailModal } from './HertzPostDetailModal';
import { HertzPostProvider } from './HertzPostContext';

export function HertzFeedShell({
  children,
  currentUser,
  initialPostShortId = null,
}: {
  children: ReactNode;
  currentUser: MemberSessionUser | null;
  initialPostShortId?: string | null;
}) {
  const router = useRouter();
  const hydratedRef = useRef(false);
  const [activeShortId, setActiveShortId] = useState<string | null>(initialPostShortId);

  const syncFromLocation = useCallback(() => {
    const fromPath = parseHertzPostPathname(window.location.pathname);
    if (fromPath) {
      setActiveShortId(fromPath);
      return;
    }
    setActiveShortId(null);
  }, []);

  const openPost = useCallback((shortId: string) => {
    const path = buildHertzPostPath(shortId);
    setActiveShortId(shortId);
    if (window.location.pathname !== path) {
      window.history.pushState(window.history.state, '', path);
    }
  }, []);

  const closePost = useCallback(() => {
    setActiveShortId(null);
    if (parseHertzPostPathname(window.location.pathname)) {
      window.history.pushState(window.history.state, '', '/hertz');
    }
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const search = window.location.search;
    const legacyPost = hasLegacyHertzPostQuery(search) ? parseLegacyHertzPostQuery(search) : null;

    if (legacyPost) {
      setActiveShortId(legacyPost);
      const postPath = buildHertzPostPath(legacyPost);
      replaceCanonicalPath(postPath);
      router.replace(postPath, { scroll: false });
    } else if (!initialPostShortId) {
      syncFromLocation();
    }
  }, [initialPostShortId, router, syncFromLocation]);

  useEffect(() => {
    function onPopState() {
      syncFromLocation();
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [syncFromLocation]);

  return (
    <HertzPostProvider openPost={openPost} closePost={closePost}>
      {children}
      {activeShortId ? (
        <HertzPostDetailModal shortId={activeShortId} currentUser={currentUser} onClose={closePost} />
      ) : null}
    </HertzPostProvider>
  );
}
