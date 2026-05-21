'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreIcon } from '@/components/feed/HertzIcons';
import { DmAvatar } from './DmAvatar';
import {
  formatDmTimestamp,
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const threadActions = getDmThreadMenuActions({ active: Boolean(activeId), archived: filter === 'archived' });

  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeId, messages]);

  useEffect(() => {
    if (!threadMenuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onToggleMenu();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [threadMenuOpen, onToggleMenu]);

  const threadMenu =
    threadMenuOpen && activeId ? (
      <div className={styles.threadMenuBackdrop} role="presentation" onClick={onToggleMenu}>
        <div
          className={styles.threadMenuSheet}
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          {threadActions.includes('Arsipkan') ? (
            <button type="button" role="menuitem" onClick={() => onArchive(true)}>
              Arsipkan
            </button>
          ) : null}
          {threadActions.includes('Buka arsip') ? (
            <button type="button" role="menuitem" onClick={() => onArchive(false)}>
              Buka arsip
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={onBlock} disabled={!activeConversation?.peer?.id}>
            Blokir pengguna
          </button>
        </div>
      </div>
    ) : null;

  return (
    <section className={styles.thread}>
      <div className={styles.threadHeader}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← Kembali
        </button>
        <DmAvatar
          src={activeConversation?.peer?.avatarUrl}
          displayName={activeConversation?.peer?.displayName}
          username={activeConversation?.peer?.username}
          className={styles.threadPeerAvatar}
        />
        <div className={styles.threadPeerMeta}>
          <strong>{activeConversation?.peer?.displayName ?? 'Pilih percakapan'}</strong>
          <span>
            {activeConversation?.peer?.username
              ? `@${activeConversation.peer.username}`
              : 'Pilih dari kotak masuk atau cari member'}
          </span>
        </div>
        <button
          type="button"
          className={styles.menuTrigger}
          onClick={onToggleMenu}
          disabled={!activeId}
          aria-label="Menu percakapan"
          aria-expanded={threadMenuOpen}
          aria-haspopup="menu"
        >
          <MoreIcon />
        </button>
      </div>
      <div className={styles.messages}>
        {!activeId ? (
          <div className={styles.emptyThread}>
            <h2>Pilih percakapan</h2>
            <p>Buka chat dari daftar kiri atau cari member untuk memulai pesan baru.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyThread}>
            <h2>Belum ada pesan</h2>
            <p>Kirim pesan pertama — teks atau gambar di bawah.</p>
          </div>
        ) : (
          <>
            {messages.map((item) => {
              const side = getDmMessageSide(item.senderId, currentUserId);
              const isOutgoing = side === 'outgoing';
              return (
                <div
                  className={`${styles.bubbleRow} ${isOutgoing ? styles.outgoing : styles.incoming}`}
                  key={item.id}
                >
                  {!isOutgoing ? (
                    <DmAvatar
                      src={item.sender.avatarUrl}
                      displayName={item.sender.displayName}
                      username={item.sender.username}
                      className={styles.messageAvatar}
                    />
                  ) : null}
                  <article className={styles.bubble}>
                    {!isOutgoing ? (
                      <span className={styles.bubbleSender}>{item.sender.displayName}</span>
                    ) : null}
                    <p className={styles.bubbleBody}>{item.body ?? 'Pesan dihapus'}</p>
                    {item.attachments.length > 0 ? (
                      <div className={styles.attachments}>
                        {item.attachments.map((attachment) => (
                          <img key={attachment.id} src={attachment.url} alt="Lampiran pesan" />
                        ))}
                      </div>
                    ) : null}
                    <footer className={styles.bubbleFooter}>
                      <time dateTime={item.createdAt}>{formatDmTimestamp(item.createdAt)}</time>
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
                    </footer>
                  </article>
                </div>
              );
            })}
            <div ref={messagesEndRef} aria-hidden="true" />
          </>
        )}
      </div>
      {composer}
      {typeof document !== 'undefined' && threadMenu ? createPortal(threadMenu, document.body) : null}
    </section>
  );
}
