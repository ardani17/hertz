'use client';

import { OutlookCard, type OutlookCardData } from './OutlookCard';
import styles from '@/app/outlook/page.module.css';

export function OutlookListClient({
  initialArticles,
}: {
  initialArticles: OutlookCardData[];
}) {
  if (initialArticles.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Belum ada artikel Outlook</p>
        <p className={styles.emptySubtext}>Analisa market akan ditampilkan di sini.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {initialArticles.map((article) => (
        <OutlookCard key={article.id} article={article} />
      ))}
    </div>
  );
}
