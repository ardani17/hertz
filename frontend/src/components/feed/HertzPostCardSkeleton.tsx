import styles from './HertzPost.module.css';

export function HertzPostCardSkeleton() {
  return (
    <article className={styles.post} role="status" data-testid="hertz-post-skeleton" aria-label="Memuat postingan">
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonBody} />
      <div className={styles.skeletonActions} />
    </article>
  );
}
