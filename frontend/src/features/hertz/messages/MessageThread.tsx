'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreIcon } from '@/components/feed/HertzIcons';
import { DmAvatar } from './DmAvatar';
import {
  formatDmTimestamp,
  getDmMessageSide,
  getDmThreadMenuActions,
} from './dm-utils';
import { MessageThreadSkeleton } from './MessageThreadSkeleton';
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
  isLoading?: boolean;
  typingLabel?: string | null;
  onBack: () => void;
  onToggleMenu: () => void;
  onArchive: (archived: boolean) => void;
  onBlock: () => void;
  onDeleteMessage: (id: string) => void;
  onReportMessage: (id: string) => void;
  composer?: ReactNode;
};

function isNearBottom(element: HTMLElement, threshold = 72) {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
}

export function MessageThread({
  activeId,
  activeConversation,
  messages,
  currentUserId,
  threadMenuOpen,
  filter,
  isLoading = false,
  typingLabel = null,
  onBack,
  onToggleMenu,
  onArchive,
  onBlock,
  onDeleteMessage,
  onReportMessage,
  composer,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const threadActions = getDmThreadMenuActions({ active: Boolean(activeId), archived: filter === 'archived' });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    setNewMessagesCount(0);
  }, []);

  useEffect(() => {
    if (!activeId) {
      prevCountRef.current = 0;
      setNewMessagesCount(0);
    }
  }, [activeId]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const onScroll = () => {
      if (isNearBottom(list)) setNewMessagesCount(0);
    };
    list.addEventListener('scroll', onScroll, { passive: true });
    return () => list.removeEventListener('scroll', onScroll);
  }, [activeId]);

  useEffect(() => {
    if (!activeId || messages.length === 0) {
      prevCountRef.current = messages.length;
      return;
    }
    const list = listRef.current;
    const previous = prevCountRef.current;
    const grew = messages.length > previous;
    prevCountRef.current = messages.length;
    if (!grew) return;
    if (!list || isNearBottom(list)) {
      scrollToBottom(previous === 0 ? 'auto' : 'smooth');
      return;
    }
    setNewMessagesCount((value) => value + (messages.length - previous));
  }, [activeId, messages, scrollToBottom]);

  useEffect(() => {
    if (!threadMenuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onToggleMenu();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [threadMenuOpen, onToggleMenu]);

  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    const list = listRef.current;
    const previous = prevCountRef.current;
    const grew = messages.length > previous;
    prevCountRef.current = messages.length;
    if (!grew) return;
    if (!list || isNearBottom(list)) {
      scrollToBottom(previous === 0 ? 'auto' : 'smooth');
      return;
    }
    setNewMessagesCount((value) => value + (messages.length - previous));
  }, [activeId, messages, scrollToBottom]);

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

  if (activeId && isLoading && messages.length === 0) {
    return <MessageThreadSkeleton />;
  }

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
      <div className={styles.messages} data-testid="dm-message-list" ref={listRef}>
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
                          <img key={attachment.id} src={attachment.url} alt="Lampiran pesan" loading="lazy" decoding="async" width={320} height={240} />
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
        {newMessagesCount > 0 ? (
          <button type="button" className={styles.newMessagesPill} onClick={() => scrollToBottom()}>
            Pesan baru
          </button>
        ) : null}
      </div>
      {typingLabel ? <p className={styles.typingIndicator}>{typingLabel}</p> : null}
      {composer}
      {typeof document !== 'undefined' && threadMenu ? createPortal(threadMenu, document.body) : null}
    </section>
  );
}
