'use client';

import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './DmAttachmentLightbox.module.css';

export function DmAttachmentLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [handleKeyDown]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau gambar"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.content}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Tutup pratinjau">
          <X aria-hidden="true" size={20} />
        </button>
        <img src={url} alt="Lampiran pesan ukuran penuh" className={styles.image} loading="lazy" decoding="async" />
      </div>
    </div>,
    document.body,
  );
}
