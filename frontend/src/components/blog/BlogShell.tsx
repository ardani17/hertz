'use client';

import { useCallback, useState, type ReactNode } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { SectionShell } from '@/components/spa/SectionShell';
import { useLegacyQueryCleanup } from '@/lib/spa/useLegacyQueryCleanup';
import { BlogArticleModal } from './BlogArticleModal';
import { BlogArticleProvider } from './BlogArticleContext';

function hasLegacyBlogPostParam(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.has('post');
}

export function BlogShell({
  children,
  currentUser,
}: {
  children: ReactNode;
  currentUser: MemberSessionUser | null;
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const openArticle = useCallback((slug: string) => {
    setActiveSlug(slug);
  }, []);

  const closeArticle = useCallback(() => {
    setActiveSlug(null);
  }, []);

  const onHydrate = useCallback((params: URLSearchParams) => {
    const slug = (params.get('post') ?? '').trim();
    if (slug) setActiveSlug(slug);
  }, []);

  useLegacyQueryCleanup({
    canonicalPath: '/blog',
    shouldHydrate: hasLegacyBlogPostParam,
    onHydrate,
  });

  return (
    <BlogArticleProvider openArticle={openArticle}>
      <SectionShell section="blog">{children}</SectionShell>
      {activeSlug ? (
        <BlogArticleModal slug={activeSlug} currentUser={currentUser} onClose={closeArticle} />
      ) : null}
    </BlogArticleProvider>
  );
}
