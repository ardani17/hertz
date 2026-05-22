import type { ReactNode } from 'react';
import styles from './AdminPageHeader.module.css';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  kicker?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ title, description, kicker, actions }: AdminPageHeaderProps) {
  return (
    <header className={styles.header}>
      {kicker ? <span className={styles.kicker}>{kicker}</span> : null}
      <div className={styles.row}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
