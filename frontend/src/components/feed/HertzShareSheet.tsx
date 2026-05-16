'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { HertzPost } from '@shared/types';
import { Button } from '@/components/ui/button';
import { trapFocusWithin } from '@/lib/focusTrap';
import styles from './HertzShareSheet.module.css';

export interface HertzShareTarget {
  label: string;
  href: string;
}

export function buildCanonicalPostUrl(shortId: string, origin: string) {
  return `${origin.replace(/\/$/, '')}/hertz/post/${shortId}`;
}

export function buildHertzShareTargets({
  shortId,
  text,
  origin,
}: {
  shortId: string;
  text: string;
  origin: string;
}): HertzShareTarget[] {
  const url = buildCanonicalPostUrl(shortId, origin);
  const message = text.trim() || 'Postingan HERTZ';
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(message);
  const encodedMessageWithUrl = encodeURIComponent(`${message} ${url}`);

  return [
    { label: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodedMessageWithUrl}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];
}

export function canUseNativeShare(navigatorLike: Partial<Navigator> | null | undefined) {
  return typeof navigatorLike?.share === 'function';
}

export function HertzShareSheet({
  post,
  onClose,
  onMessage,
}: {
  post: HertzPost;
  onClose: () => void;
  onMessage: (message: string) => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [nativeShareAvailable, setNativeShareAvailable] = useState(false);
  const origin = typeof window === 'undefined' ? 'https://horizon.cloudnexify.com' : window.location.origin;
  const canonicalUrl = buildCanonicalPostUrl(post.shortId, origin);
  const targets = useMemo(
    () => buildHertzShareTargets({ shortId: post.shortId, text: post.content.text, origin }),
    [origin, post.content.text, post.shortId],
  );

  useEffect(() => {
    setNativeShareAvailable(canUseNativeShare(navigator));
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function copyLink() {
    await navigator.clipboard?.writeText(canonicalUrl);
    onMessage('Link disalin.');
    onClose();
  }

  async function nativeShare() {
    if (!canUseNativeShare(navigator)) return;
    try {
      await navigator.share({
        title: 'Postingan HERTZ',
        text: post.content.text.trim() || 'Postingan HERTZ',
        url: canonicalUrl,
      });
      onMessage('Postingan siap dibagikan.');
      onClose();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      onMessage('Gagal membuka share bawaan.');
    }
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`share-title-${post.id}`}
        onKeyDown={(event) => trapFocusWithin(event.currentTarget, event)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <span>Bagikan</span>
            <h2 id={`share-title-${post.id}`}>Pilih tujuan share</h2>
          </div>
          <Button ref={closeRef} type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Tutup share sheet">
            ×
          </Button>
        </div>
        <div className={styles.targets}>
          {nativeShareAvailable ? (
            <Button type="button" variant="ghost" className={styles.targetButton} onClick={nativeShare}>
              Share bawaan
            </Button>
          ) : null}
          {targets.map((target) => (
            <a key={target.label} className={styles.targetLink} href={target.href} target="_blank" rel="noopener noreferrer">
              {target.label}
            </a>
          ))}
          <Button type="button" variant="ghost" className={styles.targetButton} onClick={copyLink}>
            Salin link
          </Button>
        </div>
      </section>
    </div>
  );
}
