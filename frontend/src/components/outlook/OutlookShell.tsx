'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { MemberSessionUser } from '@shared/types';
import {
  buildOutlookArticlePath,
  hasLegacyOutlookArticleQuery,
  parseLegacyOutlookArticleQuery,
  parseOutlookArticlePathname,
} from '@/lib/outlookSpa';
import { replaceCanonicalPath } from '@/lib/spa/canonicalUrl';
import { SectionShell } from '@/components/spa/SectionShell';
import { OutlookArticleModal } from './OutlookArticleModal';
import { OutlookArticleProvider } from './OutlookArticleContext';

export function OutlookShell({
  children,
  currentUser,
}: {
  children: ReactNode;
  currentUser: MemberSessionUser | null;
}) {
  const router = useRouter();
  const hydratedRef = useRef(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const syncFromLocation = useCallback(() => {
    const fromPath = parseOutlookArticlePathname(window.location.pathname);
    setActiveSlug(fromPath);
  }, []);

  const openArticle = useCallback((slug: string) => {
    const path = buildOutlookArticlePath(slug);
    setActiveSlug(slug);
    if (window.location.pathname !== path) {
      window.history.pushState(window.history.state, '', path);
    }
  }, []);

  const closeArticle = useCallback(() => {
    setActiveSlug(null);
    if (parseOutlookArticlePathname(window.location.pathname)) {
      window.history.pushState(window.history.state, '', '/outlook');
    }
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const search = window.location.search;
    const legacySlug = hasLegacyOutlookArticleQuery(search) ? parseLegacyOutlookArticleQuery(search) : null;

    if (legacySlug) {
      setActiveSlug(legacySlug);
      const articlePath = buildOutlookArticlePath(legacySlug);
      replaceCanonicalPath(articlePath);
      router.replace(articlePath, { scroll: false });
    } else {
      syncFromLocation();
    }
  }, [router, syncFromLocation]);

  useLayoutEffect(() => {
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
    <OutlookArticleProvider openArticle={openArticle} closeArticle={closeArticle}>
      <SectionShell section="outlook">{children}</SectionShell>
      {activeSlug ? (
        <OutlookArticleModal slug={activeSlug} currentUser={currentUser} onClose={closeArticle} />
      ) : null}
    </OutlookArticleProvider>
  );
}
