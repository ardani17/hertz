'use client';

import { createContext, useContext, type ReactNode } from 'react';

type BlogArticleContextValue = {
  openArticle: (slug: string) => void;
};

const BlogArticleContext = createContext<BlogArticleContextValue | null>(null);

export function BlogArticleProvider({
  openArticle,
  children,
}: {
  openArticle: (slug: string) => void;
  children: ReactNode;
}) {
  return <BlogArticleContext.Provider value={{ openArticle }}>{children}</BlogArticleContext.Provider>;
}

export function useBlogArticle() {
  const context = useContext(BlogArticleContext);
  if (!context) {
    throw new Error('useBlogArticle must be used within BlogArticleProvider');
  }
  return context;
}
