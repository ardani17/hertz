import { notFound } from 'next/navigation';
import Link from 'next/link';
import { OutlookArticleService } from '@shared/services/outlookArticleService';
import { OutlookContent, OutlookEngagement, OutlookSnapshot } from '@/components/outlook';
import { estimateReadTime, formatDate } from '@/components/article/ArticleMeta';
import { getCurrentMember } from '@/lib/memberAuth';
import { buildOutlookDetailModel } from '@/lib/outlookContent';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const kindLabels = {
  video: 'Video Outlook',
  article: 'Long Read',
  chart: 'Chart Note',
} as const;

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function buildAuthorHandle(authorName: string | null): string {
  const clean = authorName?.trim();
  if (!clean) return '@horizon';
  return clean.startsWith('@') ? clean : `@${clean}`;
}

async function loadOutlook(slug: string) {
  try {
    return await new OutlookArticleService().getPublishedBySlug(slug);
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
  const article = await loadOutlook(slug);

  if (!article) {
    return { title: 'Outlook Tidak Ditemukan' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const outlookUrl = `${baseUrl}/outlook/${article.slug}`;
  const detail = buildOutlookDetailModel(article);

  const description = detail.summary.length > 160
    ? detail.summary.slice(0, 160).trimEnd() + '…'
    : detail.summary;

  const title = detail.title;

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
  const [article, currentUser] = await Promise.all([loadOutlook(slug), getCurrentMember()]);

  if (!article) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const outlookUrl = `${baseUrl}/outlook/${article.slug}`;
  const detail = buildOutlookDetailModel(article);
  const excerpt = detail.summary;
  const displayTitle = detail.title;
  const primaryMedia = detail.primaryMedia;
  const authorHandle = buildAuthorHandle(article.author_name);
  const authorInitial = (article.author_name?.trim().charAt(0) || 'H').toUpperCase();
  const readTime = estimateReadTime(article.content_html);

  // JSON-LD structured data (Article schema)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: displayTitle,
    description: excerpt,
    image: article.media.find((m) => m.media_type === 'image')?.file_url || `${baseUrl}/images/og-default.svg`,
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
      <div className={styles.content}>
          <Link href="/outlook" className={styles.backLink}>
            Kembali ke Outlook
          </Link>

          <article className={styles.article}>
            <header className={styles.postHeader}>
              <div className={styles.spineNode} aria-hidden="true">
                <span>{detail.kind === 'video' ? 'V' : detail.kind === 'chart' ? 'C' : 'A'}</span>
              </div>
              <div className={styles.avatar} aria-hidden="true">{authorInitial}</div>
              <div className={styles.headerBody}>
                <div className={styles.authorLine}>
                  <strong>{article.author_name || 'Horizon'}</strong>
                  <span>{authorHandle}</span>
                  <span>{formatDate(article.created_at)}</span>
                </div>
                <div className={styles.metaLine}>
                  <span className={styles.kindBadge}>{kindLabels[detail.kind]}</span>
                  <span>{detail.kind === 'article' ? `${readTime} menit baca` : 'Market direction'}</span>
                </div>
              </div>
            </header>

            <h1 className={styles.title}>{displayTitle}</h1>

          {primaryMedia ? (
            <div className={styles.primaryMedia}>
              {primaryMedia.type === 'image' ? (
                <img
                  src={primaryMedia.url}
                  alt={displayTitle}
                  className={styles.primaryImage}
                />
              ) : primaryMedia.type === 'video' || isDirectVideoUrl(primaryMedia.url) ? (
                <video className={styles.primaryVideo} controls preload="metadata">
                  <source src={primaryMedia.url} />
                  Browser Anda tidak mendukung video.
                </video>
              ) : (
                <iframe
                  className={styles.primaryEmbed}
                  src={primaryMedia.url}
                  title={displayTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          ) : null}

          {detail.summary ? <p className={styles.summary}>{detail.summary}</p> : null}

          <OutlookSnapshot items={detail.snapshot} variant="panel" />

          {detail.keyPoints.length > 0 ? (
            <section className={styles.keyPoints} aria-label="Key points">
              <h2>Key Points</h2>
              <ul>
                {detail.keyPoints.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </section>
          ) : null}

          {detail.hasBody ? <OutlookContent html={article.content_html} /> : null}

          {detail.galleryMedia.length > 0 && (
            <section className={styles.mediaSection} aria-label="Media artikel">
              <div className={styles.mediaGrid}>
                {detail.galleryMedia.map((m) => (
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
        </article>

        <OutlookEngagement
          articleId={article.id}
          title={displayTitle}
          excerpt={excerpt}
          url={outlookUrl}
          initialLikeCount={article.likeCount}
          initialCommentCount={article.commentCount}
          currentUser={currentUser}
        />
      </div>
    </>
  );
}
