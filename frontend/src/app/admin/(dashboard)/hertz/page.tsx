'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin';
import styles from './hertz.module.css';

interface PendingHertzPost {
  id: string;
  title: string | null;
  body: string;
  source: string;
  author_name: string | null;
  telegram_message_id: number | null;
  created_at: string;
  status: string;
}

interface PendingResponse {
  posts: PendingHertzPost[];
  counts: {
    pendingPosts: number;
    reportedPosts: number;
  };
  reports: Array<{
    id: string;
    target_type: string;
    target_id: string;
    reason: string;
    details: string | null;
    reporter_name: string | null;
    message_preview?: string | null;
    created_at: string;
  }>;
}

export default function AdminHertzPage() {
  const [data, setData] = useState<PendingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/hertz/pending', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? 'Gagal memuat pending post');
      }

      setData(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat HERTZ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  async function runAction(postId: string, action: 'publish' | 'reject' | 'hide') {
    setActionId(postId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/hertz/posts/${postId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: action === 'reject' ? 'Ditolak admin' : undefined }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? 'Aksi gagal');
      }

      await loadPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aksi gagal');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className={styles.page}>
      <AdminPageHeader
        kicker="HERTZ"
        title="Moderasi Feed"
        description="Review draft Telegram, report terbuka, dan antrian moderasi feed."
        actions={
          <button className={styles.refreshButton} onClick={loadPending} disabled={loading} type="button">
            Refresh
          </button>
        }
      />

      <section className={styles.metrics} aria-label="HERTZ moderation summary">
        <div>
          <span>{data?.counts.pendingPosts ?? 0}</span>
          <p>Post Telegram pending</p>
        </div>
        <div>
          <span>{data?.counts.reportedPosts ?? 0}</span>
          <p>Report terbuka</p>
        </div>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Report Terbuka</h2>
          <p>Post, komentar, Blog, dan DM yang perlu ditinjau admin.</p>
        </div>

        {!loading && data?.reports.length === 0 ? (
          <div className={styles.empty}>Tidak ada report terbuka.</div>
        ) : null}

        <div className={styles.list}>
          {data?.reports.map((report) => (
            <article key={report.id} className={styles.postCard}>
              <div className={styles.postMeta}>
                <span>{report.target_type}</span>
                <span>{report.reporter_name ?? 'Member'}</span>
                <span>{report.reason}</span>
              </div>
              <h3>{report.target_id.slice(0, 8)}</h3>
              {report.message_preview ? <p>{report.message_preview}</p> : null}
              {report.details ? <p>{report.details}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Telegram Draft</h2>
          <p>Post dari Telegram member tetap mengikuti alur admin /publish.</p>
        </div>

        {loading ? <div className={styles.empty}>Memuat...</div> : null}

        {!loading && data?.posts.length === 0 ? (
          <div className={styles.empty}>Tidak ada draft Telegram yang menunggu review.</div>
        ) : null}

        <div className={styles.list}>
          {data?.posts.map((post) => (
            <article key={post.id} className={styles.postCard}>
              <div className={styles.postMeta}>
                <span>{post.source}</span>
                <span>{post.author_name ?? 'Telegram member'}</span>
                {post.telegram_message_id ? <span>#{post.telegram_message_id}</span> : null}
              </div>
              <h3>{post.title ?? 'Untitled HERTZ post'}</h3>
              <p>{post.body}</p>
              <div className={styles.actions}>
                <button
                  className={styles.primary}
                  onClick={() => runAction(post.id, 'publish')}
                  disabled={actionId === post.id}
                >
                  Publish
                </button>
                <button onClick={() => runAction(post.id, 'reject')} disabled={actionId === post.id}>
                  Reject
                </button>
                <button onClick={() => runAction(post.id, 'hide')} disabled={actionId === post.id}>
                  Hide
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
