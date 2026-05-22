import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@shared/db';
import { LegacyArticleService } from '@shared/services/legacyArticleService';
import { ArticleContent } from '@/components/article/ArticleContent';
import { ArticleMeta } from '@/components/article/ArticleMeta';
import { OutlookEngagement } from '@/components/outlook';
import { getCurrentMember } from '@/lib/memberAuth';
import styles from './page.module.css';

export const revalidate = 300;

interface SlugRow {
  slug: string;
}

async function loadArticle(slug: string) {
  try {
    return await new LegacyArticleService().getPublishedBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const result = await query<SlugRow>(
      `SELECT slug FROM articles WHERE status = $1 ORDER BY created_at DESC LIMIT 100`,
      ['published'],
    );
    return result.rows.map((row) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await loadArticle(slug);

  if (!article) {
    return { title: 'Artikel Tidak Ditemukan' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const articleUrl = `${baseUrl}/artikel/${article.slug}`;

  const plainText = article.content_html.replace(/<[^>]*>/g, '').trim();
  const description =
    plainText.length > 160 ? plainText.slice(0, 160).trimEnd() + '…' : plainText;

  const title = article.title || description.slice(0, 60);
  const firstImage = article.media.find((m) => m.media_type === 'image');
  const ogImage = firstImage?.file_url || `${baseUrl}/images/og-default.svg`;

  return {
    title,
    description,
    alternates: { canonical: articleUrl },
    openGraph: { title, description, url: articleUrl, type: 'article', images: [{ url: ogImage }] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, currentUser] = await Promise.all([loadArticle(slug), getCurrentMember()]);

  if (!article) {
    notFound();
  }

  const displayTitle =
    article.title || article.content_html.replace(/<[^>]*>/g, '').trim().slice(0, 80);

  const plainText = article.content_html.replace(/<[^>]*>/g, '').trim();
  const excerpt = plainText.length > 120 ? plainText.slice(0, 120).trimEnd() + '…' : plainText;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const articleUrl = `${baseUrl}/artikel/${article.slug}`;
  const firstImage = article.media.find((m) => m.media_type === 'image');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: displayTitle,
    description: excerpt,
    image: firstImage?.file_url || `${baseUrl}/images/og-default.svg`,
    datePublished: article.created_at,
    author: { '@type': 'Person', name: article.author_name || 'Anonim' },
    publisher: { '@type': 'Organization', name: 'Horizon Trader Platform' },
    url: articleUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.content}>
        <Link href="/hertz" className={styles.backLink}>
          ← Kembali ke HERTZ
        </Link>

        <article className={styles.article}>
          <h1 className={styles.title}>{displayTitle}</h1>

          <ArticleMeta
            authorName={article.author_name}
            createdAt={article.created_at}
            contentHtml={article.content_html}
            category={article.category}
          />

          <ArticleContent html={article.content_html} />

          {article.media.length > 0 ? (
            <section className={styles.mediaSection} aria-label="Media artikel">
              <div className={styles.mediaGrid}>
                {article.media.map((m) => (
                  <div key={m.id} className={styles.mediaItem}>
                    {m.media_type === 'video' ? (
                      <video controls preload="metadata">
                        <source src={m.file_url} />
                        Browser Anda tidak mendukung video.
                      </video>
                    ) : (
                      <img
                        src={m.file_url}
                        alt={article.title || 'Media artikel'}
                        loading="lazy"
                        decoding="async"
                        width={480}
                        height={270}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <OutlookEngagement
          articleId={article.id}
          title={displayTitle}
          excerpt={excerpt}
          url={articleUrl}
          initialLikeCount={article.likeCount}
          initialCommentCount={article.commentCount}
          currentUser={currentUser}
          contentLabel="Artikel"
        />
      </div>
    </>
  );
}
