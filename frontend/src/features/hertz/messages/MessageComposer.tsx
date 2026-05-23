'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { ImagePlus, SendHorizontal } from 'lucide-react';
import { createThrottleEmitter } from '@/lib/throttle';
import { shouldSendMessage } from './messageComposerRules';
import type { PendingAttachment } from './types';
import styles from './messages.module.css';

type MessageComposerProps = {
  activeId: string | null;
  body: string;
  attachments: PendingAttachment[];
  uploading: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  onBodyChange: (value: string) => void;
  onSend: () => void;
  onUpload: (files: FileList | null) => void;
  onRemoveAttachment: (fileUrl: string) => void;
};

const typingEmitter = createThrottleEmitter(1_800);

async function emitTyping(conversationId: string) {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
  await fetch(`/api/hertz/messages/conversations/${conversationId}/typing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }).catch(() => undefined);
}

async function clearTyping(conversationId: string) {
  await fetch(`/api/hertz/messages/conversations/${conversationId}/typing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clear: true }),
  }).catch(() => undefined);
}

export function MessageComposer({
  activeId,
  body,
  attachments,
  uploading,
  textareaRef,
  onBodyChange,
  onSend,
  onUpload,
  onRemoveAttachment,
}: MessageComposerProps) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const resolvedRef = textareaRef ?? localRef;

  useEffect(() => {
    typingEmitter.reset();
  }, [activeId]);

  async function handleSend() {
    if (activeId) await clearTyping(activeId);
    onSend();
  }

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
              <img src={attachment.fileUrl} alt="" loading="lazy" decoding="async" width={72} height={72} />
              <span>{attachment.name}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className={styles.composer} data-testid="dm-composer">
        <label className={styles.attachButton} aria-label="Lampirkan gambar">
          <ImagePlus aria-hidden="true" />
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
        <textarea
          ref={resolvedRef}
          value={body}
          rows={1}
          onChange={(event) => {
            onBodyChange(event.target.value);
            if (activeId && typingEmitter.shouldEmit()) void emitTyping(activeId);
          }}
          onKeyDown={(event) => {
            if (
              shouldSendMessage({
                key: event.key,
                shiftKey: event.shiftKey,
                body,
                attachmentCount: attachments.length,
                uploading,
                hasConversation: Boolean(activeId),
              })
            ) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder={activeId ? 'Pesan' : 'Pilih percakapan dulu'}
          disabled={!activeId}
        />
        <button
          type="button"
          className={styles.composerSend}
          onClick={() => void handleSend()}
          disabled={!activeId || uploading || (!body.trim() && attachments.length === 0)}
          aria-label="Kirim pesan"
        >
          <SendHorizontal aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
