'use client';

import { useRouter } from 'next/navigation';
import type { NotificationItemData } from '@/lib/swr/hooks/useNotifications';
import { markNotificationRead } from '@/lib/swr/hooks/useNotifications';
import { getNotificationActionCopy, type HertzNotificationDto } from '@/lib/hertzNotifications';
import styles from './NotificationItem.module.css';

function formatTime(value?: string) {
  if (!value) return '';
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}j`;
  return `${Math.round(hours / 24)}h`;
}

function toNotificationCopy(item: NotificationItemData) {
  return getNotificationActionCopy(item as Pick<HertzNotificationDto, 'type' | 'actor'>);
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
    if (unread) {
      try {
        await markNotificationRead(item.id);
      } catch {
        return;
      }
    }
    if (item.href) router.push(item.href);
    onNavigate();
  }

  return (
    <button type="button" className={`${styles.row} ${unread ? styles.rowUnread : ''}`} onClick={() => void handleClick()}>
      <strong>{toNotificationCopy(item)}</strong>
      {item.body || item.post?.preview ? <p>{item.body ?? item.post?.preview}</p> : null}
      <time>{formatTime(item.createdAt)}</time>
    </button>
  );
}
