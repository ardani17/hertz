import styles from './messages.module.css';

export function MessageThreadSkeleton() {
  return (
    <div className={styles.threadSkeleton} role="status" aria-label="Memuat percakapan">
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonMessages}>
        <span className={styles.skeletonBubbleLeft} />
        <span className={styles.skeletonBubbleRight} />
        <span className={styles.skeletonBubbleLeft} />
        <span className={styles.skeletonBubbleRight} />
      </div>
      <div className={styles.skeletonComposer} />
    </div>
  );
}
