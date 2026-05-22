'use client';

import { markAllNotificationsRead, useNotificationList } from '@/lib/swr/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { NotificationListSkeleton } from './NotificationListSkeleton';
import styles from './NotificationDropdown.module.css';

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useNotificationList(8, true);

  return (
    <div className={styles.panel} role="dialog" aria-label="Notifications">
      <div className={styles.header}>
        <h2>Notifications</h2>
        <button type="button" className={styles.markAll} onClick={() => void markAllNotificationsRead()}>
          Mark all as read
        </button>
      </div>
      <div className={styles.list}>
        {isLoading && !data ? <NotificationListSkeleton /> : null}
        {data?.notifications?.length ? (
          data.notifications.map((item) => (
            <NotificationItem key={item.id} item={item} onNavigate={onClose} />
          ))
        ) : !isLoading ? (
          <p className={styles.empty}>Belum ada notifikasi.</p>
        ) : null}
      </div>
    </div>
  );
}
