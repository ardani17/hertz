'use client';

import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import type { NotificationItemData } from '@/lib/swr/hooks/useNotifications';
import { NOTIFICATION_SUMMARY_KEY } from '@/lib/swr/hooks/useNotifications';
import styles from './NotificationItem.module.css';

function formatTime(value?: string) {
  if (!value) return '';
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}j`;
  return `${Math.round(hours / 24)}h`;
}

export function NotificationItem({
  item,
  onNavigate,
}: {
  item: NotificationItemData;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const unread = !item.readAt;

  async function handleClick() {
    await fetch(`/api/hertz/notifications/${item.id}/read`, { method: 'POST' });
    await Promise.all([
      mutate(NOTIFICATION_SUMMARY_KEY),
      mutate((key) => typeof key === 'string' && key.startsWith('/api/hertz/notifications?')),
    ]);
    if (item.href) router.push(item.href);
    onNavigate();
  }

  return (
    <button type="button" className={`${styles.row} ${unread ? styles.rowUnread : ''}`} onClick={() => void handleClick()}>
      <strong>{item.title ?? item.type ?? 'Notifikasi'}</strong>
      {item.body || item.post?.preview ? <p>{item.body ?? item.post?.preview}</p> : null}
      <time>{formatTime(item.createdAt)}</time>
    </button>
  );
}
