'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { copyShareLinkWithFeedback } from '@/lib/shareLink';
import styles from './ShareButtons.module.css';

interface ShareButtonsProps {
  /** Article title for share text */
  title: string;
  /** Short excerpt / description for share text */
  excerpt: string;
  /** Full canonical URL of the article */
  url: string;
}

export function ShareButtons({ url }: ShareButtonsProps) {
  const { showToast } = useToast();

  const handleCopyLink = useCallback(async () => {
    await copyShareLinkWithFeedback(url, showToast);
  }, [url, showToast]);

  return (
    <div className={styles.shareButtons} aria-label="Bagikan artikel">
      <button
        type="button"
        className={`${styles.shareBtn} ${styles.copyLink}`}
        onClick={handleCopyLink}
        aria-label="Salin link artikel"
        title="Salin Link"
      >
        🔗 Salin link
      </button>
    </div>
  );
}
