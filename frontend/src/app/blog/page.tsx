import type { Metadata } from 'next';
import Link from 'next/link';
import { query } from '@shared/db';
import { PAGINATION } from '@shared/constants';
import { BlogCard } from '@/components/blog';
import type { BlogCardData } from '@/components/blog';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artikel blog Horizon hasil import WordPress.',
  alternates: { canonical: '/blog' },
};

export const dynamic = 'force-dynamic';

const PAGE_SIZE = PAGINATION.BLOG_PAGE_SIZE;

interface ArticleRow {
  id: string;
  title: string | null;
  content_html: string;
  slug: string;
  created_at: Date;
  author_name: string | null;
  cover_image: string | null;
}

interface CountRow {
  count: string;
}

async function getBlogArticles(page: number, search: string): Promise<{ articles: BlogCardData[]; total: number }> {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const params: unknown[] = ['published', 'blog', 'wordpress'];
    let whereClause = 'WHERE a.status = $1 AND a.category = $2 AND a.source = $3';
    if (search) {
      whereClause += ' AND (a.title ILIKE $4 OR a.content_html ILIKE $4)';
      params.push(`%${search}%`);
    }
    const [articlesResult, countResult] = await Promise.all([
      query<ArticleRow>(
        `SELECT a.id, a.title, a.content_html, a.slug, a.created_at,
                u.username AS author_name,
                (SELECT m.file_url FROM media m WHERE m.article_id = a.id AND m.media_type = 'image' ORDER BY m.created_at ASC LIMIT 1) AS cover_image
         FROM articles a
         LEFT JOIN users u ON a.author_id = u.id
         ${whereClause}
         ORDER BY a.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, PAGE_SIZE, offset],
      ),
      query<CountRow>(`SELECT COUNT(*)::text AS count FROM articles a ${whereClause}`, params.slice()),
    ]);
    return {
      articles: articlesResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        content_html: row.content_html,
        slug: row.slug,
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        author_name: row.author_name,
        cover_image: row.cover_image,
      })),
      total: parseInt(countResult.rows[0]?.count || '0', 10),
    };
  } catch {
    return { articles: [], total: 0 };
  }
}

function buildHref(page: number, search: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (search) params.set('search', search);
  const qs = params.toString();
  return qs ? `/blog?${qs}` : '/blog';
}

function ServerPagination({ currentPage, totalPages, search }: { currentPage: number; totalPages: number; search: string }) {
  if (totalPages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Navigasi halaman">
      {currentPage > 1 ? <Link href={buildHref(currentPage - 1, search)} className={styles.pageLink}>Prev</Link> : null}
      <span className={styles.pageLinkActive}>{currentPage} / {totalPages}</span>
      {currentPage < totalPages ? <Link href={buildHref(currentPage + 1, search)} className={styles.pageLink}>Next</Link> : null}
    </nav>
  );
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const rawPage = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const currentPage = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const search = typeof params.search === 'string' ? params.search.trim() : '';
  const [{ articles, total }, currentUser] = await Promise.all([getBlogArticles(currentPage, search), getCurrentMember()]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <HertzAppShell active="blog" title="Blog" description="Artikel hasil import WordPress." currentUser={currentUser}>
      <form className={styles.searchForm} action="/blog" method="get">
        <input type="search" name="search" className={styles.searchInput} placeholder="Cari artikel blog..." defaultValue={search} aria-label="Cari artikel blog" />
      </form>
      {articles.length > 0 ? (
        <>
          <div className={styles.list}>{articles.map((article) => <BlogCard key={article.id} article={article} />)}</div>
          <ServerPagination currentPage={currentPage} totalPages={totalPages} search={search} />
        </>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Belum ada artikel WordPress</p>
          <p className={styles.emptySubtext}>Artikel blog akan tampil setelah import WordPress selesai.</p>
        </div>
      )}
    </HertzAppShell>
  );
}
