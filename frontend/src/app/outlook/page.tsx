import type { Metadata } from 'next';
import { query } from '@shared/db';
import { OutlookCard } from '@/components/outlook';
import type { OutlookCardData } from '@/components/outlook';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Outlook',
  description: 'Analisa market mendalam dari komunitas trader Horizon.',
  alternates: { canonical: '/outlook' },
};

export const dynamic = 'force-dynamic';

interface OutlookRow {
  id: string;
  title: string | null;
  content_html: string;
  slug: string;
  created_at: Date;
  author_name: string | null;
  cover_image: string | null;
  video_media: string | null;
  outlook_metadata: unknown;
}

async function getOutlookArticles(): Promise<OutlookCardData[]> {
  try {
    const result = await query<OutlookRow>(
      `SELECT a.id, a.title, a.content_html, a.slug, a.created_at, a.outlook_metadata,
              u.username AS author_name,
              (SELECT m.file_url FROM media m WHERE m.article_id = a.id AND m.media_type = 'image' ORDER BY m.created_at ASC LIMIT 1) AS cover_image,
              (SELECT m.file_url FROM media m WHERE m.article_id = a.id AND m.media_type = 'video' ORDER BY m.created_at ASC LIMIT 1) AS video_media
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.status = $1 AND a.category = $2
       ORDER BY a.created_at DESC`,
      ['published', 'outlook'],
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      content_html: row.content_html,
      slug: row.slug,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      author_name: row.author_name,
      cover_image: row.cover_image,
      outlook_metadata: row.outlook_metadata,
      media: [
        ...(row.cover_image ? [{ id: `${row.id}-cover`, file_url: row.cover_image, media_type: 'image' }] : []),
        ...(row.video_media ? [{ id: `${row.id}-video`, file_url: row.video_media, media_type: 'video' }] : []),
      ],
    }));
  } catch {
    return [];
  }
}

export default async function OutlookPage() {
  const [articles, currentUser] = await Promise.all([getOutlookArticles(), getCurrentMember()]);

  return (
    <HertzAppShell active="outlook" title="Outlook" description="Ringkasan narasi market, ide besar, dan konteks sebelum eksekusi." currentUser={currentUser}>
      {articles.length > 0 ? (
        <div className={styles.list}>
          {articles.map((article) => <OutlookCard key={article.id} article={article} />)}
        </div>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Belum ada artikel Outlook</p>
          <p className={styles.emptySubtext}>Analisa market akan ditampilkan di sini.</p>
        </div>
      )}
    </HertzAppShell>
  );
}
