'use client';

import { MoreIcon } from '@/components/feed/HertzIcons';
import {
  formatDmTimestamp,
  getDmInitial,
  getDmMessageSide,
  getDmThreadMenuActions,
} from './dm-utils';
import type { ReactNode } from 'react';
import type { Conversation, Message } from './types';
import styles from './messages.module.css';

type MessageThreadProps = {
  activeId: string | null;
  activeConversation: Conversation | null;
  messages: Message[];
  currentUserId?: string;
  threadMenuOpen: boolean;
  filter: 'inbox' | 'unread' | 'admin' | 'archived';
  onBack: () => void;
  onToggleMenu: () => void;
  onArchive: (archived: boolean) => void;
  onBlock: () => void;
  onDeleteMessage: (id: string) => void;
  onReportMessage: (id: string) => void;
  composer?: ReactNode;
};

export function MessageThread({
  activeId,
  activeConversation,
  messages,
  currentUserId,
  threadMenuOpen,
  filter,
  onBack,
  onToggleMenu,
  onArchive,
  onBlock,
  onDeleteMessage,
  onReportMessage,
  composer,
}: MessageThreadProps) {
  const threadActions = getDmThreadMenuActions({ active: Boolean(activeId), archived: filter === 'archived' });

  return (
    <section className={styles.thread}>
      <div className={styles.threadHeader}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          Kotak masuk
        </button>
        <div className={styles.threadPeerAvatar} aria-hidden="true">
          {getDmInitial(activeConversation?.peer?.displayName, activeConversation?.peer?.username)}
        </div>
        <div>
          <strong>{activeConversation?.peer?.displayName ?? 'Pilih percakapan'}</strong>
          <span>{activeConversation?.peer?.username ? `@${activeConversation.peer.username}` : 'Pesan HERTZ'}</span>
        </div>
        <div className={styles.threadMenu}>
          <button
            type="button"
            className={styles.menuTrigger}
            onClick={onToggleMenu}
            disabled={!activeId}
            aria-label="Menu percakapan"
            aria-expanded={threadMenuOpen}
          >
            <MoreIcon />
          </button>
          {threadMenuOpen ? (
            <div className={styles.threadActions}>
              {threadActions.includes('Arsipkan') ? (
                <button type="button" onClick={() => onArchive(true)}>
                  Arsipkan
                </button>
              ) : null}
              {threadActions.includes('Buka arsip') ? (
                <button type="button" onClick={() => onArchive(false)}>
                  Buka arsip
                </button>
              ) : null}
              <button type="button" onClick={onBlock} disabled={!activeConversation?.peer?.id}>
                Blokir
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.messages}>
        {!activeId ? (
          <div className={styles.emptyThread}>
            <h2>Pilih pesan</h2>
            <p>Pilih percakapan atau cari member untuk mulai pesan langsung.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyThread}>
            <h2>Belum ada pesan</h2>
            <p>Kirim pesan pertama ke percakapan ini.</p>
          </div>
        ) : (
          messages.map((item) => {
            const side = getDmMessageSide(item.senderId, currentUserId);
            return (
              <div
                className={`${styles.bubbleRow} ${side === 'outgoing' ? styles.outgoing : styles.incoming}`}
                key={item.id}
              >
                {side === 'incoming' ? (
                  <span className={styles.messageAvatar} aria-hidden="true">
                    {getDmInitial(item.sender.displayName, item.sender.username)}
                  </span>
                ) : null}
                <div className={styles.bubble}>
                  <div className={styles.bubbleMeta}>
                    <strong>{side === 'outgoing' ? 'Anda' : item.sender.displayName}</strong>
                    <time>{formatDmTimestamp(item.createdAt)}</time>
                  </div>
                  <span>{item.body ?? 'Pesan dihapus'}</span>
                  {item.attachments.length ? (
                    <div className={styles.attachments}>
                      {item.attachments.map((attachment) => (
                        <img key={attachment.id} src={attachment.url} alt="DM attachment" />
                      ))}
                    </div>
                  ) : null}
                  <div className={styles.messageActions}>
                    {item.canDelete ? (
                      <button type="button" onClick={() => onDeleteMessage(item.id)}>
                        Hapus
                      </button>
                    ) : null}
                    <button type="button" onClick={() => onReportMessage(item.id)}>
                      Laporkan
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {composer}
    </section>
  );
}
