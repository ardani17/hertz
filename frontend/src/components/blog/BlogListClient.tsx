'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { BlogCard, type BlogCardData } from './BlogCard';
import { Button } from '@/components/ui/button';
import { useLegacyQueryCleanup } from '@/lib/spa/useLegacyQueryCleanup';
import styles from '@/app/blog/page.module.css';

type BlogListState = {
  page: number;
  search: string;
};

function hasBlogListQueryParams(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.has('page') || params.has('search');
}

export function BlogListClient({
  initialArticles,
  initialTotal,
  initialPage,
  initialSearch,
}: {
  initialArticles: BlogCardData[];
  initialTotal: number;
  initialPage: number;
  initialSearch: string;
}) {
  const pageSize = 12;
  const [filters, setFilters] = useState<BlogListState>({
    page: initialPage,
    search: initialSearch,
  });
  const [articles, setArticles] = useState(initialArticles);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useLegacyQueryCleanup({
    canonicalPath: '/blog',
    shouldHydrate: hasBlogListQueryParams,
    onHydrate: (params) => {
      const rawPage = parseInt(params.get('page') ?? '1', 10);
      setFilters({
        page: Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1,
        search: (params.get('search') ?? '').trim(),
      });
    },
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadPage = useCallback(async (next: BlogListState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (next.page > 1) params.set('page', String(next.page));
      if (next.search) params.set('search', next.search);
      const response = await fetch(`/api/blog/public?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) return;
      setArticles(payload.data.articles);
      setTotal(payload.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      setReady(true);
      if (filters.page === initialPage && filters.search === initialSearch) return;
    }
    void loadPage(filters);
  }, [filters, initialPage, initialSearch, ready, loadPage]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextSearch = String(formData.get('search') ?? '').trim();
    setFilters({ page: 1, search: nextSearch });
  }

  return (
    <>
      <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
        <input
          type="search"
          name="search"
          className={styles.searchInput}
          placeholder="Cari artikel blog..."
          defaultValue={filters.search}
          key={filters.search || 'empty-blog-search'}
          aria-label="Cari artikel blog"
        />
      </form>
      {loading && articles.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Memuat artikel…</p>
        </div>
      ) : articles.length > 0 ? (
        <>
          <div className={styles.list}>
            {articles.map((article) => (
              <BlogCard key={article.id} article={article} />
            ))}
          </div>
          {totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Navigasi halaman">
              {filters.page > 1 ? (
                <Button type="button" variant="ghost" onClick={() => setFilters((c) => ({ ...c, page: c.page - 1 }))}>
                  Prev
                </Button>
              ) : null}
              <span className={styles.pageLinkActive}>
                {filters.page} / {totalPages}
              </span>
              {filters.page < totalPages ? (
                <Button type="button" variant="ghost" onClick={() => setFilters((c) => ({ ...c, page: c.page + 1 }))}>
                  Next
                </Button>
              ) : null}
            </nav>
          ) : null}
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
