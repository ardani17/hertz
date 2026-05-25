'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, Mail, MessageCircle, Quote, Repeat2 } from 'lucide-react';
import { HertzTelegramLogin } from '@/components/feed/HertzTelegramLogin';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { DmAvatar } from '@/features/hertz/messages/DmAvatar';
import type { MemberSessionUser } from '@shared/types';
import {
  formatNotificationListTime,
  getNotificationActionCopy,
  getNotificationTypeLabel,
  type HertzNotificationDto,
  type HertzNotificationType,
} from '@/lib/hertzNotifications';
import { markAllNotificationsRead, markNotificationRead } from '@/lib/swr/hooks/useNotifications';
import styles from './notifications.module.css';

type NotifFilter = 'all' | 'unread';

function NotificationTypeIcon({ type }: { type: HertzNotificationType }) {
  const className = styles.typeIcon;
  if (type === 'pulse') return <Heart className={className} aria-hidden="true" />;
  if (type === 'comment') return <MessageCircle className={className} aria-hidden="true" />;
  if (type === 'repost') return <Repeat2 className={className} aria-hidden="true" />;
  if (type === 'quote') return <Quote className={className} aria-hidden="true" />;
  return <Mail className={className} aria-hidden="true" />;
}

export function NotificationsView() {
  const [currentUser, setCurrentUser] = useState<MemberSessionUser | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'guest' | 'member'>('loading');
  const [items, setItems] = useState<HertzNotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotifFilter>('all');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [markingAll, setMarkingAll] = useState(false);

  const loadCurrentUser = useCallback(async () => {
    const response = await fetch('/api/auth/me', { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    const user = response.ok && payload?.success ? payload.data.user ?? null : null;
    setCurrentUser(user);
    setAuthState(user ? 'member' : 'guest');
  }, []);

  const loadNotifications = useCallback(async () => {
    setStatus('loading');
    const response = await fetch('/api/hertz/notifications', { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) {
      setItems(payload.data.notifications ?? []);
      setUnreadCount(Number(payload.data.summary?.unreadCount ?? 0));
      setStatus('ready');
    } else {
      setStatus('error');
    }
  }, []);

  const filteredItems = useMemo(
    () => (filter === 'unread' ? items.filter((item) => !item.readAt) : items),
    [filter, items],
  );

  async function markAllRead() {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((next) => next.map((item) => ({ ...item, readAt: item.readAt ?? now })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  async function markItemRead(id: string) {
    const target = items.find((item) => item.id === id);
    if (!target || target.readAt) return;
    try {
      await markNotificationRead(id);
      setItems((next) =>
        next.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      return;
    }
  }

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (authState === 'member') void loadNotifications();
  }, [authState, loadNotifications]);

  return (
    <HertzAppShell
      active="notifications"
      title="Notifikasi"
      description="Aktivitas sosial di HERTZ — suka, komentar, repost, dan DM."
      currentUser={currentUser}
      mobileMarketPosition="hidden"
      fillViewport
    >
      {authState !== 'member' ? (
        <section className={styles.guestPanel}>
          <span className={styles.eyebrow}>
            {authState === 'loading' ? 'Memuat sesi...' : 'Mode tamu'}
          </span>
          <h2>Login untuk melihat notifikasi</h2>
          <p>Notifikasi aktivitas HERTZ hanya tersedia untuk member yang sudah login.</p>
          {authState === 'guest' ? <HertzTelegramLogin /> : null}
        </section>
      ) : (
        <section className={styles.panel}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Pusat aktivitas</p>
              <h2>Notifikasi</h2>
            </div>
            {unreadCount > 0 ? (
              <span className={styles.unreadPill}>{unreadCount} baru</span>
            ) : null}
          </header>

          <div className={styles.toolbar}>
            <div className={styles.filters} role="tablist" aria-label="Filter notifikasi">
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'all'}
                className={filter === 'all' ? styles.filterActive : styles.filterChip}
                onClick={() => setFilter('all')}
              >
                Semua
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'unread'}
                className={filter === 'unread' ? styles.filterActive : styles.filterChip}
                onClick={() => setFilter('unread')}
              >
                Belum baca
                {unreadCount > 0 ? <em>{unreadCount}</em> : null}
              </button>
            </div>
            <button
              type="button"
              className={styles.markAllButton}
              onClick={markAllRead}
              disabled={unreadCount === 0 || markingAll}
            >
              {markingAll ? 'Memproses...' : 'Tandai dibaca'}
            </button>
          </div>

          <div className={styles.listScroll}>
            {status === 'error' ? (
              <div className={styles.stateBox} role="alert">
                <p>Notifikasi gagal dimuat.</p>
                <button type="button" onClick={() => void loadNotifications()}>
                  Coba lagi
                </button>
              </div>
            ) : null}

            {status === 'loading' ? (
              <p className={styles.stateBox} role="status" aria-live="polite">
                Memuat notifikasi...
              </p>
            ) : null}

            {status === 'ready' && filteredItems.length === 0 ? (
              <div className={styles.stateBox} role="status">
                <p>
                  {filter === 'unread'
                    ? 'Semua notifikasi sudah dibaca.'
                    : 'Belum ada notifikasi. Interaksi di feed akan muncul di sini.'}
                </p>
              </div>
            ) : null}

            <ul className={styles.list}>
              {filteredItems.map((item) => {
              const isUnread = !item.readAt;
              return (
                <li key={item.id}>
                  <a
                    className={`${styles.item} ${isUnread ? styles.itemUnread : ''}`}
                    href={item.href}
                    aria-label={`${getNotificationActionCopy(item)}${isUnread ? ', belum dibaca' : ''}`}
                    onClick={() => void markItemRead(item.id)}
                  >
                    <span className={styles.avatarWrap}>
                      <DmAvatar
                        src={item.actor?.avatarUrl}
                        displayName={item.actor?.displayName}
                        username={item.actor?.username}
                        className={styles.avatar}
                      />
                      <span className={styles.typeBadge} title={getNotificationTypeLabel(item.type)}>
                        <NotificationTypeIcon type={item.type} />
                      </span>
                    </span>
                    <span className={styles.copy}>
                      <strong>{getNotificationActionCopy(item)}</strong>
                      <span>{item.post?.preview?.trim() || 'Ketuk untuk melihat detail'}</span>
                    </span>
                    <span className={styles.meta}>
                      {isUnread ? <span className={styles.unreadDot} aria-hidden="true" /> : null}
                      <time dateTime={String(item.createdAt)}>
                        {formatNotificationListTime(item.createdAt)}
                      </time>
                    </span>
                  </a>
                </li>
              );
            })}
            </ul>
          </div>
        </section>
      )}
    </HertzAppShell>
  );
}
