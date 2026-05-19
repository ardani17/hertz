'use client';

import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { trapFocusWithin } from '@/lib/focusTrap';
import styles from '@/components/feed/HertzPostMenu.module.css';

type ReportDialogProps = {
  postId: string;
  open: boolean;
  reason: string;
  details: string;
  onReasonChange: (value: string) => void;
  onDetailsChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ReportDialog({
  postId,
  open,
  reason,
  details,
  onReasonChange,
  onDetailsChange,
  onClose,
  onSubmit,
}: ReportDialogProps) {
  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <form
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`report-title-${postId}`}
        onSubmit={onSubmit}
        onKeyDown={(event) => trapFocusWithin(event.currentTarget, event)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.panelHeader}>
          <h2 id={`report-title-${postId}`}>Laporkan postingan</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Tutup laporan"
          >
            ×
          </Button>
        </div>
        <label htmlFor={`report-reason-${postId}`}>Alasan report</label>
        <select id={`report-reason-${postId}`} value={reason} onChange={(event) => onReasonChange(event.target.value)}>
          <option value="misleading">Misleading</option>
          <option value="spam">Spam</option>
          <option value="abusive">Abusive</option>
          <option value="off_topic">Off topic</option>
          <option value="other">Other</option>
        </select>
        <textarea
          value={details}
          onChange={(event) => onDetailsChange(event.target.value)}
          placeholder="Detail opsional"
          rows={3}
        />
        <div className={styles.panelActions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">Kirim laporan</Button>
        </div>
      </form>
    </div>
  );
}
