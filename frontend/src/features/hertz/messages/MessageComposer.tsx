'use client';

import { ImagePlus, SendHorizontal } from 'lucide-react';
import type { PendingAttachment } from './types';
import styles from './messages.module.css';

type MessageComposerProps = {
  activeId: string | null;
  body: string;
  attachments: PendingAttachment[];
  uploading: boolean;
  onBodyChange: (value: string) => void;
  onSend: () => void;
  onUpload: (files: FileList | null) => void;
  onRemoveAttachment: (fileUrl: string) => void;
};

export function MessageComposer({
  activeId,
  body,
  attachments,
  uploading,
  onBodyChange,
  onSend,
  onUpload,
  onRemoveAttachment,
}: MessageComposerProps) {
  return (
    <>
      {attachments.length ? (
        <div className={styles.pendingAttachments}>
          {attachments.map((attachment) => (
            <button
              type="button"
              key={attachment.fileUrl}
              onClick={() => onRemoveAttachment(attachment.fileUrl)}
              aria-label={`Hapus attachment ${attachment.name}`}
            >
              <img src={attachment.fileUrl} alt="" />
              <span>{attachment.name}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className={styles.composer}>
        <label className={styles.attachButton}>
          <ImagePlus aria-hidden="true" />
          <span>Gambar</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={!activeId || uploading || attachments.length >= 4}
            onChange={(event) => {
              onUpload(event.target.files);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <input
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          placeholder={activeId ? 'Tulis pesan baru...' : 'Pilih percakapan dulu'}
        />
        <button type="button" onClick={onSend} disabled={!activeId || uploading} aria-label="Kirim pesan">
          <SendHorizontal aria-hidden="true" />
          <span>Kirim</span>
        </button>
      </div>
    </>
  );
}
