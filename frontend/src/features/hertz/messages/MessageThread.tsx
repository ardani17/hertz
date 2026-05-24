'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreIcon } from '@/components/feed/HertzIcons';
import { DmAvatar } from './DmAvatar';
import { ThreadIntro } from './ThreadIntro';
import {
  formatDmBubbleTime,
  getDmMessageSide,
  getDmProfileHref,
  getDmThreadMenuActions,
  groupDmMessagesByDate,
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
  filter: 'inbox' | 'unread' | 'archived';
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

function shouldShowIncomingAvatar(messages: Message[], index: number, currentUserId?: string) {
  const item = messages[index];
  if (!item || getDmMessageSide(item.senderId, currentUserId) !== 'incoming') return false;
  const next = messages[index + 1];
  if (!next) return true;
  return getDmMessageSide(next.senderId, currentUserId) !== 'incoming';
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
  const initialLoadRef = useRef(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const threadActions = getDmThreadMenuActions({ active: Boolean(activeId), archived: filter === 'archived' });
  const messageGroups = groupDmMessagesByDate(messages);
  const profileHref = getDmProfileHref(activeConversation?.peer?.username);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    setNewMessagesCount(0);
  }, []);

  useEffect(() => {
    if (!activeId) {
      prevCountRef.current = 0;
      initialLoadRef.current = true;
      setNewMessagesCount(0);
      return;
    }
    prevCountRef.current = 0;
    initialLoadRef.current = true;
    setNewMessagesCount(0);
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

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      setNewMessagesCount(0);
      requestAnimationFrame(() => scrollToBottom('auto'));
      return;
    }

    if (!grew) return;

    if (!list || isNearBottom(list)) {
      setNewMessagesCount(0);
      scrollToBottom('smooth');
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

  const peerHeader =
    profileHref && activeConversation?.peer ? (
      <Link className={styles.threadPeerLink} href={profileHref}>
        <DmAvatar
          src={activeConversation.peer.avatarUrl}
          displayName={activeConversation.peer.displayName}
          username={activeConversation.peer.username}
          className={styles.threadPeerAvatar}
        />
        <div className={styles.threadPeerMeta}>
          <strong>{activeConversation.peer.displayName}</strong>
          <span>@{activeConversation.peer.username?.replace(/^@/, '')}</span>
        </div>
      </Link>
    ) : (
      <>
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
              ? `@${activeConversation.peer.username.replace(/^@/, '')}`
              : 'Pilih dari kotak masuk atau cari member'}
          </span>
        </div>
      </>
    );

  return (
    <section className={styles.thread} aria-label="Percakapan aktif">
      {/* Header: profil + menu saja — tanpa voice/video call */}
      <header className={styles.threadHeader}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← Kembali
        </button>
        {peerHeader}
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
      </header>

      <div className={styles.threadBody}>
        <div className={styles.messages} data-testid="dm-message-list" ref={listRef}>
          {!activeId ? (
            <div className={styles.emptyThread}>
              <h2>Pilih percakapan</h2>
              <p>Buka chat dari daftar kiri atau cari member untuk memulai pesan baru.</p>
            </div>
          ) : messages.length === 0 ? (
            <>
              {activeConversation?.peer ? <ThreadIntro peer={activeConversation.peer} /> : null}
              <div className={styles.emptyThread}>
                <h2>Belum ada pesan</h2>
                <p>Kirim pesan pertama — teks atau gambar di bawah.</p>
              </div>
            </>
          ) : (
            <div className={styles.messageStack}>
              {activeConversation?.peer ? <ThreadIntro peer={activeConversation.peer} /> : null}
              {messageGroups.map((group) => (
                <div className={styles.messageDayGroup} key={group.label}>
                  <div className={styles.dateDivider}>
                    <span>{group.label}</span>
                  </div>
                  {group.messages.map((item) => {
                    const globalIndex = messages.findIndex((message) => message.id === item.id);
                    const side = getDmMessageSide(item.senderId, currentUserId);
                    const isOutgoing = side === 'outgoing';
                    const showAvatar = shouldShowIncomingAvatar(messages, globalIndex, currentUserId);
                    return (
                      <div
                        className={`${styles.bubbleRow} ${isOutgoing ? styles.outgoing : styles.incoming}`}
                        key={item.id}
                      >
                        {!isOutgoing ? (
                          <span className={styles.avatarSlot} aria-hidden={!showAvatar}>
                            {showAvatar ? (
                              <DmAvatar
                                src={item.sender.avatarUrl}
                                displayName={item.sender.displayName}
                                username={item.sender.username}
                                className={styles.messageAvatar}
                              />
                            ) : null}
                          </span>
                        ) : null}
                        <div className={styles.bubbleColumn}>
                          <article className={styles.bubble}>
                            <p className={styles.bubbleBody}>{item.body ?? 'Pesan dihapus'}</p>
                            {item.attachments.length > 0 ? (
                              <div className={styles.attachments}>
                                {item.attachments.map((attachment) => (
                                  <img
                                    key={attachment.id}
                                    src={attachment.url}
                                    alt="Lampiran pesan"
                                    loading="lazy"
                                    decoding="async"
                                    width={280}
                                    height={200}
                                  />
                                ))}
                              </div>
                            ) : null}
                            {isOutgoing ? (
                              <footer className={styles.bubbleInlineMeta}>
                                <time dateTime={item.createdAt}>{formatDmBubbleTime(item.createdAt)}</time>
                              </footer>
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
                          </article>
                          {!isOutgoing ? (
                            <time className={styles.bubbleTime} dateTime={item.createdAt}>
                              {formatDmBubbleTime(item.createdAt)}
                            </time>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} className={styles.messagesEnd} aria-hidden="true" />
            </div>
          )}
          {newMessagesCount > 0 ? (
            <button type="button" className={styles.newMessagesPill} onClick={() => scrollToBottom()}>
              {newMessagesCount} pesan baru
            </button>
          ) : null}
        </div>
      </div>

      <footer className={styles.threadFooter}>
        {typingLabel ? <p className={styles.typingIndicator}>{typingLabel}</p> : null}
        {composer}
      </footer>

      {typeof document !== 'undefined' && threadMenu ? createPortal(threadMenu, document.body) : null}
    </section>
  );
}
