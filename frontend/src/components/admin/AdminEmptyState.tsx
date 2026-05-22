import styles from './AdminEmptyState.module.css';

interface AdminEmptyStateProps {
  title: string;
  subtitle?: string;
}

export function AdminEmptyState({ title, subtitle }: AdminEmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </div>
  );
}
