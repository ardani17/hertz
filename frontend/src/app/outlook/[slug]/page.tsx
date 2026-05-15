import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query, queryOne } from '@shared/db';
import { OutlookContent } from '@/components/outlook';
import { ArticleMeta } from '@/components/article/ArticleMeta';
import { ShareButtons } from '@/components/article/ShareButtons';
import { CommentSection } from '@/components/article/CommentSection';
import { LikeButton } from '@/components/article/LikeButton';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
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

interface OutlookDetail {
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

async function getOutlookBySlug(slug: string): Promise<OutlookDetail | null> {
  try {
    const article = await queryOne<ArticleRow>(
      `SELECT a.id, a.title, a.content_html, a.category,
              a.slug, a.status, a.created_at, u.username AS author_name
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.slug = $1 AND a.status = $2 AND a.category = $3`,
      [slug, 'published', 'outlook']
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
  const article = await getOutlookBySlug(slug);

  if (!article) {
    return { title: 'Outlook Tidak Ditemukan' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const outlookUrl = `${baseUrl}/outlook/${article.slug}`;

  const plainText = article.content_html.replace(/<[^>]*>/g, '').trim();
  const description =
    plainText.length > 160
      ? plainText.slice(0, 160).trimEnd() + '…'
      : plainText;

  const title = article.title || 'Outlook';

  // Use first image media as og:image, fallback to platform default
  const firstImage = article.media.find((m) => m.media_type === 'image');
  const ogImage = firstImage?.file_url || `${baseUrl}/images/og-default.svg`;

  return {
    title,
    description,
    alternates: {
      canonical: outlookUrl,
    },
    openGraph: {
      title,
      description,
      url: outlookUrl,
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

export default async function OutlookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getOutlookBySlug(slug);

  if (!article) {
    notFound();
  }

  const displayTitle =
    article.title ||
    article.content_html.replace(/<[^>]*>/g, '').trim().slice(0, 80);

  const plainText = article.content_html.replace(/<[^>]*>/g, '').trim();
  const excerpt = plainText.length > 120
    ? plainText.slice(0, 120).trimEnd() + '…'
    : plainText;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const outlookUrl = `${baseUrl}/outlook/${article.slug}`;

  // Find cover image (first image media)
  const coverImage = article.media.find((m) => m.media_type === 'image');
  // Additional media (excluding cover)
  const additionalMedia = coverImage
    ? article.media.filter((m) => m.id !== coverImage.id)
    : article.media;

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
      name: 'Horizon Trader Platform',
    },
    url: outlookUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HertzAppShell
        active="outlook"
        title="Outlook"
        description="Narasi market dan konteks besar sebelum eksekusi."
        currentUser={null}
      >
        <div className={styles.content}>
        <Link href="/outlook" className={styles.backLink}>
          ← Kembali ke Outlook
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

          <OutlookContent html={article.content_html} />

          {additionalMedia.length > 0 && (
            <section className={styles.mediaSection} aria-label="Media artikel">
              <div className={styles.mediaGrid}>
                {additionalMedia.map((m) => (
                  <div key={m.id} className={styles.mediaItem}>
                    {m.media_type === 'video' ? (
                      <video controls preload="metadata">
                        <source src={m.file_url} />
                        Browser Anda tidak mendukung video.
                      </video>
                    ) : (

                      <img
                        src={m.file_url}
                        alt={displayTitle}
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className={styles.stats}>
            <span className={styles.statItem}>
              ❤️ {article.likeCount} suka
            </span>
            <span className={styles.statItem}>
              💬 {article.commentCount} komentar
            </span>
          </div>
        </article>

        <div className={styles.interactions}>
          <ShareButtons
            title={displayTitle}
            excerpt={excerpt}
            url={outlookUrl}
          />

          <LikeButton
            articleId={article.id}
            initialLikeCount={article.likeCount}
          />
        </div>

        <CommentSection articleId={article.id} />
        </div>
      </HertzAppShell>
    </>
  );
}
