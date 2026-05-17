import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query, queryOne } from '@shared/db';
import { ArticleMeta } from '@/components/article/ArticleMeta';
import { ArticleContent } from '@/components/article/ArticleContent';
import { OutlookEngagement } from '@/components/outlook';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface ArticleRow {
  id: string;
  title: string | null;
  content_html: string;
  category: string;
  slug: string;
  status: string;
  created_at: Date;
  author_name: string | null;
}

interface MediaRow {
  id: string;
  file_url: string;
  media_type: string;
}

interface CountRow {
  count: string;
}

interface BlogDetail {
  id: string;
  title: string | null;
  content_html: string;
  category: string;
  slug: string;
  created_at: string;
  author_name: string | null;
  media: Array<{ id: string; file_url: string; media_type: string }>;
  commentCount: number;
  likeCount: number;
}

async function getBlogBySlug(slug: string): Promise<BlogDetail | null> {
  try {
    const article = await queryOne<ArticleRow>(
      `SELECT a.id, a.title, a.content_html, a.category,
              a.slug, a.status, a.created_at, u.username AS author_name
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.slug = $1 AND a.status = $2 AND a.category = $3 AND a.source = $4`,
      [slug, 'published', 'blog', 'wordpress']
    );

    if (!article) return null;

    const [mediaResult, commentCountResult, likeCountResult] = await Promise.all([
      query<MediaRow>(
        `SELECT id, file_url, media_type FROM media WHERE article_id = $1 ORDER BY created_at ASC`,
        [article.id]
      ),
      queryOne<CountRow>(
        `SELECT COUNT(*)::text AS count FROM comments WHERE article_id = $1 AND status = $2`,
        [article.id, 'visible']
      ),
      queryOne<CountRow>(
        `SELECT COUNT(*)::text AS count FROM likes WHERE article_id = $1`,
        [article.id]
      ),
    ]);

    return {
      id: article.id,
      title: article.title,
      content_html: article.content_html,
      category: article.category,
      slug: article.slug,
      created_at:
        article.created_at instanceof Date
          ? article.created_at.toISOString()
          : String(article.created_at),
      author_name: article.author_name,
      media: mediaResult.rows,
      commentCount: parseInt(commentCountResult?.count || '0', 10),
      likeCount: parseInt(likeCountResult?.count || '0', 10),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getBlogBySlug(slug);

  if (!article) {
    return { title: 'Blog Tidak Ditemukan' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const blogUrl = `${baseUrl}/blog/${article.slug}`;

  const plainText = article.content_html.replace(/<[^>]*>/g, '').trim();
  const description =
    plainText.length > 160
      ? plainText.slice(0, 160).trimEnd() + '…'
      : plainText;

  const title = article.title || 'Blog';

  // Use first image media as og:image, fallback to platform default
  const firstImage = article.media.find((m) => m.media_type === 'image');
  const ogImage = firstImage?.file_url || `${baseUrl}/images/og-default.svg`;

  return {
    title,
    description,
    alternates: {
      canonical: blogUrl,
    },
    openGraph: {
      title,
      description,
      url: blogUrl,
      type: 'article',
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, currentUser] = await Promise.all([getBlogBySlug(slug), getCurrentMember()]);

  if (!article) {
    notFound();
  }

  const displayTitle =
    article.title ||
    article.content_html.replace(/<[^>]*>/g, '').trim().slice(0, 80);

  const plainText = article.content_html.replace(/<[^>]*>/g, '').trim();
  const excerpt =
    plainText.length > 120
      ? plainText.slice(0, 120).trimEnd() + '…'
      : plainText;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const blogUrl = `${baseUrl}/blog/${article.slug}`;

  // Find cover image (first image media)
  const coverImage = article.media.find((m) => m.media_type === 'image');

  // JSON-LD structured data (Article schema)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: displayTitle,
    description: excerpt,
    image: coverImage?.file_url || `${baseUrl}/images/og-default.svg`,
    datePublished: article.created_at,
    author: {
      '@type': 'Person',
      name: article.author_name || 'Anonim',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Horizon',
    },
    url: blogUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <HertzAppShell
        active="blog"
        title="Blog"
        description="Artikel hasil import WordPress."
        currentUser={currentUser}
      >
        <div className={styles.content}>
          <Link href="/blog" className={styles.backLink}>
            ← Kembali ke Blog
          </Link>

          <article className={styles.article}>
            <h1 className={styles.title}>{displayTitle}</h1>

            <ArticleMeta
              authorName={article.author_name}
              createdAt={article.created_at}
              contentHtml={article.content_html}
              category={article.category}
            />

            {coverImage && (

              <img
                src={coverImage.file_url}
                alt={displayTitle}
                className={styles.coverImage}
              />
            )}

            <ArticleContent html={article.content_html} />
          </article>

          <OutlookEngagement
            articleId={article.id}
            title={displayTitle}
            excerpt={excerpt}
            url={blogUrl}
            initialLikeCount={article.likeCount}
            initialCommentCount={article.commentCount}
            currentUser={currentUser}
            contentLabel="Blog"
          />
        </div>
      </HertzAppShell>
    </>
  );
}
