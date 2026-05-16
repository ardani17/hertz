'use client';

import { useEffect, useRef, useState } from 'react';
import type { HertzPostDetail, MemberSessionUser } from '@shared/types';
import { Button } from '@/components/ui/button';
import {
  getHertzPostDetailMobileMarketPosition,
  shouldOpenDesktopPostModal,
} from '@/lib/hertzPostDetailUi';
import { HertzActionBar } from './HertzActionBar';
import { HertzAuthorLine } from './HertzAuthorLine';
import { HertzAvatar } from './HertzAvatar';
import { HertzDetailInteractions } from './HertzDetailInteractions';
import { HertzMarketMeta } from './HertzMarketMeta';
import { HertzPostMedia } from './HertzPostMedia';
import { QuotePostCard } from './QuotePostCard';
import styles from './HertzPostDetailModal.module.css';

export { getHertzPostDetailMobileMarketPosition, shouldOpenDesktopPostModal };

export function HertzPostDetailModal({
  shortId,
  currentUser,
  onClose,
}: {
  shortId: string;
  currentUser: MemberSessionUser | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [post, setPost] = useState<HertzPostDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setPost(null);
    setError(null);

    async function loadPost() {
      try {
        const response = await fetch(`/api/hertz/posts/${shortId}`, {
          credentials: 'same-origin',
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success || !payload.data?.post) {
          setError(payload?.error?.message ?? 'Detail postingan tidak tersedia.');
          return;
        }
        setPost(payload.data.post);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setError('Detail postingan tidak tersedia.');
      }
    }

    closeRef.current?.focus();
    void loadPost();
    return () => controller.abort();
  }, [shortId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`post-detail-modal-${shortId}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <span>Detail post</span>
            <h2 id={`post-detail-modal-${shortId}`}>HERTZ</h2>
          </div>
          <Button ref={closeRef} type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Tutup detail postingan">
            ×
          </Button>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        {!post && !error ? <p className={styles.loading}>Memuat postingan...</p> : null}
        {post ? (
          <div className={styles.content}>
            <article className={styles.post}>
              <HertzAvatar className={styles.avatar} src={post.author.avatarUrl} name={post.author.name} username={post.author.username} />
              <div className={styles.body}>
                <HertzAuthorLine post={post} />
                <p className={styles.text}>{post.content.text}</p>
                <HertzPostMedia media={post.media} />
                <HertzMarketMeta post={post} />
                <QuotePostCard post={post.quotedPost} />
                <HertzActionBar post={post} currentUser={currentUser} enableDetailModal={false} />
              </div>
            </article>
            <HertzDetailInteractions post={post} currentUser={currentUser} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
