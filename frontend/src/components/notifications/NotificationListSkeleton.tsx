import styles from './NotificationItem.module.css';

export function NotificationListSkeleton() {
  return (
    <div role="status" aria-label="Memuat notifikasi">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow}>
          <span className={styles.skeletonAvatar} />
          <span className={styles.skeletonLines}>
            <span />
            <span />
          </span>
        </div>
      ))}
    </div>
  );
}
