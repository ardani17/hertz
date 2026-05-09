'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './hertz.module.css';

interface PendingSignalPost {
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
  posts: PendingSignalPost[];
  counts: {
    pendingPosts: number;
    pendingNotes: number;
    reportedPosts: number;
  };
}

export default function AdminSignalLedgerPage() {
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
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>HERTZ</p>
          <h1>Moderasi Feed</h1>
        </div>
        <button className={styles.refreshButton} onClick={loadPending} disabled={loading}>
          Refresh
        </button>
      </header>

      <section className={styles.metrics} aria-label="HERTZ moderation summary">
        <div>
          <span>{data?.counts.pendingPosts ?? 0}</span>
          <p>Post Telegram pending</p>
        </div>
        <div>
          <span>{data?.counts.pendingNotes ?? 0}</span>
          <p>Note aktif</p>
        </div>
        <div>
          <span>{data?.counts.reportedPosts ?? 0}</span>
          <p>Report terbuka</p>
        </div>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}

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
