'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { buildOutlookArticlePath } from '@/lib/outlookSpa';

export type OutlookArticleContextValue = {
  openArticle: (slug: string) => void;
  closeArticle: () => void;
};

const OutlookArticleContext = createContext<OutlookArticleContextValue | null>(null);

export function OutlookArticleProvider({
  openArticle,
  closeArticle,
  children,
}: {
  openArticle: (slug: string) => void;
  closeArticle: () => void;
  children: ReactNode;
}) {
  return (
    <OutlookArticleContext.Provider value={{ openArticle, closeArticle }}>{children}</OutlookArticleContext.Provider>
  );
}

export function useOutlookArticle(): OutlookArticleContextValue {
  const context = useContext(OutlookArticleContext);
  if (!context) {
    throw new Error('useOutlookArticle must be used within OutlookArticleProvider');
  }
  return context;
}

export function useOutlookArticleNavigation(): OutlookArticleContextValue {
  const context = useContext(OutlookArticleContext);
  return {
    openArticle: (slug: string) => {
      if (context) {
        context.openArticle(slug);
        return;
      }
      window.location.assign(buildOutlookArticlePath(slug));
    },
    closeArticle: () => {
      context?.closeArticle();
    },
  };
}
