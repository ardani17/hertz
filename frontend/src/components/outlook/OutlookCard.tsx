import Link from 'next/link';
import styles from './OutlookCard.module.css';
import { estimateReadTime, formatDate } from '@/components/article/ArticleMeta';
import { ClickableArticle } from '@/components/article/ClickableArticle';
import { buildOutlookCardModel, type OutlookMediaInput } from '@/lib/outlookContent';
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
  const model = buildOutlookCardModel(article);
  const readTime = estimateReadTime(article.content_html);
  const href = `/outlook/${article.slug}`;
  const cardClassName = [
    styles.card,
    model.mediaPreview ? styles.withMedia : styles.textOnly,
    styles[model.kind],
  ].join(' ');

  return (
    <ClickableArticle className={cardClassName} href={href}>
      {model.mediaPreview ? (
        <div className={styles.mediaPreview}>
          {model.mediaPreview.type === 'image' ? (
            <img
              src={model.mediaPreview.url}
              alt={model.title}
              className={styles.previewImage}
              loading="lazy"
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
          <Link href={href} className={styles.titleLink}>
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
    </ClickableArticle>
  );
}
