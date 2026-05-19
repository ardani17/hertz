import type { Metadata } from 'next';
import { OutlookArticleService } from '@shared/services/outlookArticleService';
import { OutlookCard } from '@/components/outlook';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Outlook',
  description: 'Analisa market mendalam dari komunitas trader Horizon.',
  alternates: { canonical: '/outlook' },
};

export const dynamic = 'force-dynamic';

export default async function OutlookPage() {
  let articles: Awaited<ReturnType<OutlookArticleService['listPublished']>> = [];
  try {
    articles = await new OutlookArticleService().listPublished();
  } catch {
    articles = [];
  }

  if (articles.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Belum ada artikel Outlook</p>
        <p className={styles.emptySubtext}>Analisa market akan ditampilkan di sini.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {articles.map((article) => (
        <OutlookCard key={article.id} article={article} />
      ))}
    </div>
  );
}
