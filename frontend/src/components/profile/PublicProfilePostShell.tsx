'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { MemberSessionUser } from '@shared/types';
import {
  buildPublicProfilePostUrl,
  getPublicProfileBasePath,
  hasLegacyHertzPostQuery,
  parseLegacyHertzPostQuery,
  stripLegacyHertzPostQuery,
} from '@/lib/hertzPostSpa';
import { HertzPostDetailModal } from '@/components/feed/HertzPostDetailModal';
import { HertzPostProvider } from '@/components/feed/HertzPostContext';

export function PublicProfilePostShell({
  username,
  currentUser,
  children,
}: {
  username: string;
  currentUser: MemberSessionUser | null;
  children: ReactNode;
}) {
  const hydratedRef = useRef(false);
  const basePath = getPublicProfileBasePath(username);
  const [activeShortId, setActiveShortId] = useState<string | null>(null);

  const syncFromLocation = useCallback(() => {
    const post = hasLegacyHertzPostQuery(window.location.search)
      ? parseLegacyHertzPostQuery(window.location.search)
      : null;
    setActiveShortId(post);
  }, []);

  const openPost = useCallback((shortId: string) => {
    const nextUrl = buildPublicProfilePostUrl(username, shortId);
    setActiveShortId(shortId);
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.pushState(window.history.state, '', nextUrl);
    }
  }, [username]);

  const closePost = useCallback(() => {
    setActiveShortId(null);
    if (hasLegacyHertzPostQuery(window.location.search)) {
      const nextSearch = stripLegacyHertzPostQuery(window.location.search);
      window.history.pushState(window.history.state, '', `${basePath}${nextSearch}`);
    }
  }, [basePath]);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    syncFromLocation();
  }, [syncFromLocation]);

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
