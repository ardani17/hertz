'use client';

import { DmAvatar } from './DmAvatar';
import {
  filterLabels,
  formatDmListTime,
  getDmPreviewText,
} from './dm-utils';
import type { Conversation, DmFilter, MemberResult } from './types';
import styles from './messages.module.css';

type ConversationListProps = {
  conversations: Conversation[];
  members: MemberResult[];
  activeId: string | null;
  query: string;
  filter: DmFilter;
  status: string | null;
  onFilterChange: (filter: DmFilter) => void;
  onSearch: (value: string) => void;
  onSelectConversation: (id: string) => void;
  onStartConversation: (memberId: string) => void;
};

export function ConversationList({
  conversations,
  members,
  activeId,
  query,
  filter,
  status,
  onFilterChange,
  onSearch,
  onSelectConversation,
  onStartConversation,
}: ConversationListProps) {
  const filtered = conversations.filter((item) => {
    if (filter === 'unread') return item.unreadCount > 0;
    if (filter === 'admin') return item.peer?.role === 'admin';
    return true;
  });

  const unreadTotal = conversations.reduce((sum, item) => sum + item.unreadCount, 0);

  return (
    <aside className={styles.sidebar} aria-labelledby="dm-inbox-title">
      <div className={styles.sidebarHeader}>
        <div>
          <p className={styles.sidebarLabel}>Pesan langsung</p>
          <h2 id="dm-inbox-title">Kotak masuk</h2>
        </div>
        {unreadTotal > 0 ? <span className={styles.unreadPill}>{unreadTotal} baru</span> : null}
      </div>
      {status ? <p className={styles.status} role="status">{status}</p> : null}
      <div className={styles.filters} role="tablist" aria-label="Filter pesan">
        {(['inbox', 'unread', 'admin', 'archived'] as const).map((item) => (
          <button
            className={filter === item ? styles.activeFilter : styles.filterChip}
            type="button"
            key={item}
            role="tab"
            aria-selected={filter === item}
            onClick={() => onFilterChange(item)}
          >
            {filterLabels[item]}
          </button>
        ))}
      </div>
      <input
        className={styles.search}
        value={query}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Cari member..."
        aria-label="Cari member untuk memulai percakapan"
      />
      {members.length > 0 ? (
        <div className={styles.searchResults} aria-label="Hasil pencarian member">
          <p className={styles.sectionHint}>Mulai percakapan baru</p>
          {members.map((member) => (
            <button
              className={styles.item}
              type="button"
              key={member.id}
              onClick={() => onStartConversation(member.id)}
            >
              <DmAvatar displayName={member.display_name} username={member.username} className={styles.itemAvatar} />
              <span className={styles.itemMain}>
                <span className={styles.itemTop}>
                  <strong>{member.display_name ?? member.username ?? 'Member'}</strong>
                </span>
                <span className={styles.itemMeta}>
                  {member.username ? `@${member.username}` : 'Member HERTZ'}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyList} role="status">
            <p>
              {filter === 'unread'
                ? 'Tidak ada pesan belum dibaca.'
                : filter === 'archived'
                  ? 'Arsip masih kosong.'
                  : filter === 'admin'
                    ? 'Belum ada percakapan dengan admin.'
                    : 'Belum ada percakapan. Cari member di atas untuk mulai.'}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                className={`${styles.item} ${isActive ? styles.itemActive : ''} ${item.unreadCount > 0 ? styles.itemUnread : ''}`}
                type="button"
                key={item.id}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelectConversation(item.id)}
              >
                <DmAvatar
                  src={item.peer?.avatarUrl}
                  displayName={item.peer?.displayName}
                  username={item.peer?.username}
                  className={styles.itemAvatar}
                />
                <span className={styles.itemMain}>
                  <span className={styles.itemTop}>
                    <strong>{item.peer?.displayName ?? 'Percakapan'}</strong>
                    <time dateTime={item.lastMessageAt ?? undefined}>
                      {formatDmListTime(item.lastMessageAt)}
                    </time>
                  </span>
                  <span className={styles.itemPreview}>{getDmPreviewText(item.lastMessageBody)}</span>
                </span>
                {item.unreadCount > 0 ? <em aria-label={`${item.unreadCount} belum dibaca`}>{item.unreadCount}</em> : null}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
