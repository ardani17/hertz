import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticleService } from '@shared/services/blogArticleService';
import { PAGINATION } from '@shared/constants';
import { BlogCard } from '@/components/blog';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artikel blog Horizon hasil import WordPress.',
  alternates: { canonical: '/blog' },
};

export const dynamic = 'force-dynamic';

const PAGE_SIZE = PAGINATION.BLOG_PAGE_SIZE;

function buildHref(page: number, search: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (search) params.set('search', search);
  const qs = params.toString();
  return qs ? `/blog?${qs}` : '/blog';
}

function ServerPagination({
  currentPage,
  totalPages,
  search,
}: {
  currentPage: number;
  totalPages: number;
  search: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Navigasi halaman">
      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1, search)} className={styles.pageLink}>
          Prev
        </Link>
      ) : null}
      <span className={styles.pageLinkActive}>
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1, search)} className={styles.pageLink}>
          Next
        </Link>
      ) : null}
    </nav>
  );
}

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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <form className={styles.searchForm} action="/blog" method="get">
        <input
          type="search"
          name="search"
          className={styles.searchInput}
          placeholder="Cari artikel blog..."
          defaultValue={search}
          aria-label="Cari artikel blog"
        />
      </form>
      {articles.length > 0 ? (
        <>
          <div className={styles.list}>
            {articles.map((article) => (
              <BlogCard key={article.id} article={article} />
            ))}
          </div>
          <ServerPagination currentPage={currentPage} totalPages={totalPages} search={search} />
        </>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Belum ada artikel WordPress</p>
          <p className={styles.emptySubtext}>Artikel blog akan tampil setelah import WordPress selesai.</p>
        </div>
      )}
    </>
  );
}
