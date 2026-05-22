'use client';

import { useEffect, useRef, useState } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { Button } from '@/components/ui/button';
import { ArticleContent } from '@/components/article/ArticleContent';
import { ArticleMeta } from '@/components/article/ArticleMeta';
import { OutlookEngagement } from '@/components/outlook';
import { trapFocusWithin } from '@/lib/focusTrap';
import styles from './BlogArticleModal.module.css';

type BlogArticleDetail = {
  id: string;
  title: string | null;
  content_html: string;
  slug: string;
  created_at: string;
  author_name: string | null;
  category: string;
  media: Array<{ id: string; file_url: string; media_type: string }>;
  commentCount: number;
  likeCount: number;
};

export function BlogArticleModal({
  slug,
  currentUser,
  onClose,
}: {
  slug: string;
  currentUser: MemberSessionUser | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [article, setArticle] = useState<BlogArticleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setArticle(null);
    setError(null);

    async function loadArticle() {
      try {
        const response = await fetch(`/api/blog/public/${encodeURIComponent(slug)}`, {
          credentials: 'same-origin',
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success || !payload.data?.article) {
          setError(payload?.error?.message ?? 'Artikel blog tidak tersedia.');
          return;
        }
        setArticle(payload.data.article);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setError('Artikel blog tidak tersedia.');
      }
    }

    closeRef.current?.focus();
    void loadArticle();
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const displayTitle =
    article?.title || article?.content_html.replace(/<[^>]*>/g, '').trim().slice(0, 80) || 'Blog';
  const plainText = article?.content_html.replace(/<[^>]*>/g, '').trim() ?? '';
  const excerpt = plainText.length > 120 ? `${plainText.slice(0, 120).trimEnd()}…` : plainText;
  const coverImage = article?.media.find((item) => item.media_type === 'image');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://horizon.cloudnexify.com';
  const blogUrl = `${baseUrl}/blog/${slug}`;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`blog-article-modal-${slug}`}
        onKeyDown={(event) => trapFocusWithin(event.currentTarget, event)}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <span>Blog</span>
            <h2 id={`blog-article-modal-${slug}`} className={styles.title}>
              {article ? displayTitle : 'Memuat artikel…'}
            </h2>
          </div>
          <Button ref={closeRef} type="button" variant="ghost" onClick={onClose} aria-label="Tutup artikel">
            Tutup
          </Button>
        </header>

        {error ? <p className={styles.error}>{error}</p> : null}
        {!article && !error ? <p className={styles.loading}>Memuat artikel blog…</p> : null}

        {article ? (
          <>
            <ArticleMeta
              authorName={article.author_name}
              createdAt={article.created_at}
              contentHtml={article.content_html}
              category={article.category}
            />
            {coverImage ? (
              <img
                src={coverImage.file_url}
                alt={displayTitle}
                className={styles.coverImage}
                loading="lazy"
                decoding="async"
                width={960}
                height={540}
              />
            ) : null}
            <ArticleContent html={article.content_html} />
            <div className={styles.engagement}>
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
          </>
        ) : null}
      </section>
    </div>
  );
}
