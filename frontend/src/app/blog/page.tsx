import type { Metadata } from 'next';
import { BlogArticleService } from '@shared/services/blogArticleService';
import { BlogListClient } from '@/components/blog/BlogListClient';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artikel blog Horizon hasil import WordPress.',
  alternates: { canonical: '/blog' },
};

export const revalidate = 120;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawPage = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const currentPage = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const search = typeof params.search === 'string' ? params.search.trim() : '';

  let articles: Awaited<ReturnType<BlogArticleService['listPublished']>>['articles'] = [];
  let total = 0;
  try {
    const result = await new BlogArticleService().listPublished(currentPage, search);
    articles = result.articles;
    total = result.total;
  } catch {
    articles = [];
  }

  return (
    <BlogListClient
      initialArticles={articles}
      initialTotal={total}
      initialPage={currentPage}
      initialSearch={search}
    />
  );
}
