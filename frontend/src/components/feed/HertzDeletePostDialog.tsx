'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import styles from './HertzDeletePostDialog.module.css';

export function getDeleteDialogCopy(postText: string) {
  const excerpt = postText.trim().slice(0, 80) || 'postingan ini';
  return {
    title: 'Hapus postingan?',
    body: `Postingan "${excerpt}" akan disembunyikan dari timeline. Aksi ini tidak langsung menghapus data permanen.`,
    confirmLabel: 'Hapus postingan',
    cancelLabel: 'Batal',
  };
}

export function HertzDeletePostDialog({
  postText,
  onCancel,
  onConfirm,
}: {
  postText: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const copy = getDeleteDialogCopy(postText);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className={styles.backdrop} role="presentation" onClick={(event) => { event.stopPropagation(); onCancel(); }}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="delete-post-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="delete-post-title">{copy.title}</h2>
        <p>{copy.body}</p>
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onCancel}>{copy.cancelLabel}</Button>
          <Button type="button" className={styles.danger} onClick={onConfirm}>{copy.confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
