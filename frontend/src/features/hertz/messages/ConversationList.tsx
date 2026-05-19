'use client';

import {
  filterLabels,
  formatDmTimestamp,
  getDmInitial,
  getDmPreviewText,
} from './dm-utils';
import type { Conversation, DmFilter, MemberResult } from './types';
import styles from './messages.module.css';

type ConversationListProps = {
  conversations: Conversation[];
  members: MemberResult[];
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

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div>
          <h2>Pesan</h2>
          <span>{conversations.length} percakapan</span>
        </div>
      </div>
      {status ? <p className={styles.status}>{status}</p> : null}
      <div className={styles.filters}>
        {(['inbox', 'unread', 'admin', 'archived'] as const).map((item) => (
          <button
            className={filter === item ? styles.activeFilter : ''}
            type="button"
            key={item}
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
        placeholder="Cari pesan langsung"
      />
      {members.length ? (
        <div className={styles.searchResults}>
          {members.map((member) => (
            <button
              className={styles.item}
              type="button"
              key={member.id}
              onClick={() => onStartConversation(member.id)}
            >
              <span className={styles.itemAvatar} aria-hidden="true">
                {getDmInitial(member.display_name, member.username)}
              </span>
              <span className={styles.itemMain}>
                <span className={styles.itemTop}>
                  <strong>{member.display_name ?? member.username ?? 'Member Horizon'}</strong>
                </span>
                <span className={styles.itemMeta}>
                  {member.username ? `@${member.username}` : 'HERTZ member'}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <div className={styles.list}>
        {filtered.map((item) => (
          <button
            className={styles.item}
            type="button"
            key={item.id}
            onClick={() => onSelectConversation(item.id)}
          >
            <span className={styles.itemAvatar} aria-hidden="true">
              {getDmInitial(item.peer?.displayName, item.peer?.username)}
            </span>
            <span className={styles.itemMain}>
              <span className={styles.itemTop}>
                <strong>{item.peer?.displayName ?? `Conversation ${item.id.slice(0, 8)}`}</strong>
                <time>{formatDmTimestamp(item.lastMessageAt)}</time>
              </span>
              <span className={styles.itemMeta}>
                {item.peer?.username ? `@${item.peer.username}` : 'HERTZ member'}
              </span>
              <span className={styles.itemPreview}>{getDmPreviewText(item.lastMessageBody)}</span>
            </span>
            {item.unreadCount > 0 ? <em>{item.unreadCount}</em> : null}
          </button>
        ))}
      </div>
    </aside>
  );
}
