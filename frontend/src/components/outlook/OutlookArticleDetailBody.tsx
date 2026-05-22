'use client';

import type { MemberSessionUser } from '@shared/types';
import { estimateReadTime, formatDate } from '@/components/article/ArticleMeta';
import { buildOutlookDetailModel, type OutlookMediaInput } from '@/lib/outlookContent';

export type OutlookArticleDetail = {
  id: string;
  title: string | null;
  content_html: string;
  slug: string;
  created_at: string;
  author_name: string | null;
  outlook_metadata?: unknown;
  media: OutlookMediaInput[];
  commentCount: number;
  likeCount: number;
};
import { OutlookContent } from './OutlookContent';
import { OutlookEngagement } from './OutlookEngagement';
import { OutlookSnapshot } from './OutlookSnapshot';
import styles from '@/app/outlook/[slug]/page.module.css';

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

export function OutlookArticleDetailBody({
  article,
  currentUser,
  outlookUrl,
}: {
  article: OutlookArticleDetail;
  currentUser: MemberSessionUser | null;
  outlookUrl: string;
}) {
  const detail = buildOutlookDetailModel(article);
  const excerpt = detail.summary;
  const displayTitle = detail.title;
  const primaryMedia = detail.primaryMedia;
  const authorHandle = buildAuthorHandle(article.author_name);
  const authorInitial = (article.author_name?.trim().charAt(0) || 'H').toUpperCase();
  const readTime = estimateReadTime(article.content_html);

  return (
    <div className={styles.content}>
      <article className={styles.article}>
        <header className={styles.postHeader}>
          <div className={styles.spineNode} aria-hidden="true">
            <span>{detail.kind === 'video' ? 'V' : detail.kind === 'chart' ? 'C' : 'A'}</span>
          </div>
          <div className={styles.avatar} aria-hidden="true">
            {authorInitial}
          </div>
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
                loading="lazy"
                decoding="async"
                width={960}
                height={540}
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
              {detail.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {detail.hasBody ? <OutlookContent html={article.content_html} /> : null}

        {detail.galleryMedia.length > 0 ? (
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
        url={outlookUrl}
        initialLikeCount={article.likeCount}
        initialCommentCount={article.commentCount}
        currentUser={currentUser}
      />
    </div>
  );
}
