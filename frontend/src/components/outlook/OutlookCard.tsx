'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import styles from './OutlookCard.module.css';
import { estimateReadTime, formatDate } from '@/components/article/ArticleMeta';
import { buildOutlookCardModel, type OutlookMediaInput } from '@/lib/outlookContent';
import { buildOutlookArticlePath } from '@/lib/outlookSpa';
import { useOutlookArticleNavigation } from './OutlookArticleContext';
import { OutlookSnapshot } from './OutlookSnapshot';

export interface OutlookCardData {
  id: string;
  title: string | null;
  content_html: string;
  slug: string;
  created_at: string;
  author_name: string | null;
  cover_image: string | null;
  outlook_metadata?: unknown;
  media: OutlookMediaInput[];
}

interface OutlookCardProps {
  article: OutlookCardData;
}

const kindLabels = {
  video: 'Video Outlook',
  article: 'Long Read',
  chart: 'Chart Note',
} as const;

/** Card component for mixed Outlook content: video, long read, and chart notes. */
export function OutlookCard({ article }: OutlookCardProps) {
  const { openArticle } = useOutlookArticleNavigation();
  const model = buildOutlookCardModel(article);
  const readTime = estimateReadTime(article.content_html);
  const href = buildOutlookArticlePath(article.slug);
  const cardClassName = [
    styles.card,
    model.mediaPreview ? styles.withMedia : styles.textOnly,
    styles[model.kind],
  ].join(' ');

  function handleOpen(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented) return;
    const target = event.target;
    if (target instanceof Element && target.closest('a[href]')) return;
    event.preventDefault();
    openArticle(article.slug);
  }

  return (
    <article
      className={cardClassName}
      role="link"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openArticle(article.slug);
        }
      }}
      aria-label={`Buka artikel Outlook: ${model.title}`}
    >
      {model.mediaPreview ? (
        <div className={styles.mediaPreview}>
          {model.mediaPreview.type === 'image' ? (
            <img
              src={model.mediaPreview.url}
              alt={model.title}
              className={styles.previewImage}
              loading="lazy"
              decoding="async"
              width={320}
              height={180}
            />
          ) : model.mediaPreview.type === 'video' ? (
            <video className={styles.previewVideo} preload="metadata" muted playsInline>
              <source src={model.mediaPreview.url} />
            </video>
          ) : (
            <div className={styles.externalVideo} aria-hidden="true" />
          )}
          {model.kind === 'video' ? <span className={styles.playIndicator}>Play</span> : null}
        </div>
      ) : null}

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.badge}>{kindLabels[model.kind]}</span>
          <time className={styles.date} dateTime={article.created_at}>
            {formatDate(article.created_at)}
          </time>
        </div>

        <h3 className={styles.title}>
          <Link
            href={href}
            className={styles.titleLink}
            onClick={(event) => {
              event.preventDefault();
              openArticle(article.slug);
            }}
          >
            {model.title}
          </Link>
        </h3>

        {model.summary ? <p className={styles.excerpt}>{model.summary}</p> : null}

        <OutlookSnapshot items={model.snapshot} />

        <div className={styles.footer}>
          <span className={styles.author}>{model.authorHandle}</span>
          <span className={styles.readTime}>
            {model.kind === 'article' ? `${readTime} menit baca` : kindLabels[model.kind]}
          </span>
        </div>
      </div>
    </article>
  );
}
