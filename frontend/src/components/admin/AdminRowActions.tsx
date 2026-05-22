'use client';

import { Eye, EyeOff, Pencil, Trash2, UserRound } from 'lucide-react';
import styles from './AdminRowActions.module.css';

interface AdminRowActionsProps {
  onEdit?: () => void;
  editTitle?: string;
  onToggleVisibility?: () => void;
  isPublished?: boolean;
  onDelete?: () => void;
  onView?: () => void;
  viewTitle?: string;
}

export function AdminRowActions({
  onEdit,
  editTitle = 'Edit',
  onToggleVisibility,
  isPublished,
  onDelete,
  onView,
  viewTitle = 'Lihat',
}: AdminRowActionsProps) {
  return (
    <div className={styles.actions}>
      {onView ? (
        <button type="button" className={styles.button} onClick={onView} title={viewTitle} aria-label={viewTitle}>
          <UserRound />
        </button>
      ) : null}
      {onEdit ? (
        <button type="button" className={styles.button} onClick={onEdit} title={editTitle} aria-label={editTitle}>
          <Pencil />
        </button>
      ) : null}
      {onToggleVisibility ? (
        <button
          type="button"
          className={styles.button}
          onClick={onToggleVisibility}
          title={isPublished ? 'Sembunyikan' : 'Publikasikan'}
          aria-label={isPublished ? 'Sembunyikan' : 'Publikasikan'}
        >
          {isPublished ? <EyeOff /> : <Eye />}
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          className={`${styles.button} ${styles.danger}`}
          onClick={onDelete}
          title="Hapus"
          aria-label="Hapus"
        >
          <Trash2 />
        </button>
      ) : null}
    </div>
  );
}
