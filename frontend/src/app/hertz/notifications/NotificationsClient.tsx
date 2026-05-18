'use client';

import { useCallback, useEffect, useState } from 'react';
import { HertzTelegramLogin } from '@/components/feed/HertzTelegramLogin';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import type { MemberSessionUser } from '@shared/types';
import { formatNotificationTime, getNotificationActionCopy, type HertzNotificationDto } from '@/lib/hertzNotifications';
import styles from './page.module.css';

export function NotificationsClient() {
  const [currentUser, setCurrentUser] = useState<MemberSessionUser | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'guest' | 'member'>('loading');
  const [items, setItems] = useState<HertzNotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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

  async function markAllRead() {
    await fetch('/api/hertz/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setItems((next) => next.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
  }

  useEffect(() => { void loadCurrentUser(); }, [loadCurrentUser]);
  useEffect(() => { if (authState === 'member') void loadNotifications(); }, [authState, loadNotifications]);

  return (
    <HertzAppShell active="notifications" title="Notifikasi" description="Like, komentar, repost, quote, dan DM terbaru." currentUser={currentUser} mobileMarketPosition="hidden">
      {authState !== 'member' ? (
        <section className={`${styles.panel} ${styles.guest}`}><div className={styles.state}>{authState === 'loading' ? 'Memuat session...' : <><p>Login Telegram untuk melihat notifikasi HERTZ.</p><HertzTelegramLogin /></>}</div></section>
      ) : (
        <section className={styles.panel}>
          <div className={styles.toolbar}><div><strong>Aktivitas terbaru</strong><br /><span>{unreadCount} belum dibaca</span></div><button type="button" onClick={markAllRead} disabled={unreadCount === 0}>Tandai semua dibaca</button></div>
          {status === 'error' ? <p className={styles.state}>Notifikasi gagal dimuat. Coba refresh halaman.</p> : null}
          {status !== 'error' && items.length === 0 ? <p className={styles.state}>{status === 'loading' ? 'Memuat notifikasi...' : 'Belum ada notifikasi.'}</p> : null}
          <div className={styles.list}>
            {items.map((item) => <a key={item.id} className={`${styles.item} ${item.readAt ? '' : styles.unread}`} href={item.href}><span className={styles.avatar}>{(item.actor?.displayName ?? 'H').charAt(0).toUpperCase()}</span><span className={styles.copy}><strong>{getNotificationActionCopy(item)}</strong><span>{item.post?.preview ?? 'Buka aktivitas ini'}</span></span><time>{formatNotificationTime(item.createdAt)}</time></a>)}
          </div>
        </section>
      )}
    </HertzAppShell>
  );
}
