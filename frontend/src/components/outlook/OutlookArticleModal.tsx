'use client';

import { useEffect, useRef, useState } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { Button } from '@/components/ui/button';
import { buildOutlookArticlePath } from '@/lib/outlookSpa';
import { trapFocusWithin } from '@/lib/focusTrap';
import { OutlookArticleDetailBody, type OutlookArticleDetail } from './OutlookArticleDetailBody';
import styles from './OutlookArticleModal.module.css';

export function OutlookArticleModal({
  slug,
  currentUser,
  onClose,
}: {
  slug: string;
  currentUser: MemberSessionUser | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [article, setArticle] = useState<OutlookArticleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setArticle(null);
    setError(null);

    async function loadArticle() {
      try {
        const response = await fetch(`/api/outlook/public/${encodeURIComponent(slug)}`, {
          credentials: 'same-origin',
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success || !payload.data?.article) {
          setError(payload?.error?.message ?? 'Artikel Outlook tidak tersedia.');
          return;
        }
        setArticle(payload.data.article);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setError('Artikel Outlook tidak tersedia.');
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://horizon.cloudnexify.com';
  const outlookUrl = `${baseUrl}${buildOutlookArticlePath(slug)}`;
  const title = article?.title || 'Outlook';

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Detail artikel Outlook"
        aria-labelledby={`outlook-article-modal-${slug}`}
        onKeyDown={(event) => trapFocusWithin(event.currentTarget, event)}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <span>Outlook</span>
            <h2 id={`outlook-article-modal-${slug}`}>{article ? title : 'Memuat artikel…'}</h2>
          </div>
          <Button ref={closeRef} type="button" variant="ghost" onClick={onClose} aria-label="Tutup artikel Outlook">
            Tutup
          </Button>
        </header>

        {error ? <p className={styles.error}>{error}</p> : null}
        {!article && !error ? <p className={styles.loading}>Memuat artikel Outlook…</p> : null}
        {article ? <OutlookArticleDetailBody article={article} currentUser={currentUser} outlookUrl={outlookUrl} /> : null}
      </section>
    </div>
  );
}
