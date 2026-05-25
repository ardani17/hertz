'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { CommentIcon, LoveIcon, ShareIcon } from '@/components/feed/HertzIcons';
import { HertzTelegramLogin } from '@/components/feed/HertzTelegramLogin';
import { useToast } from '@/components/ui/Toast';
import { copyShareLinkWithFeedback } from '@/lib/shareLink';
import styles from './OutlookEngagement.module.css';

interface CommentData {
  id: string;
  display_name: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  user_id: string | null;
}

interface OutlookEngagementProps {
  articleId: string;
  title: string;
  excerpt: string;
  url: string;
  initialLikeCount: number;
  initialCommentCount: number;
  currentUser: MemberSessionUser | null;
  contentLabel?: string;
}

function formatCommentDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function OutlookEngagement({
  articleId,
  title: _title,
  excerpt: _excerpt,
  url,
  initialLikeCount,
  initialCommentCount,
  currentUser,
  contentLabel = 'Outlook',
}: OutlookEngagementProps) {
  const { showToast } = useToast();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likePending, setLikePending] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?article_id=${articleId}`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setComments(data.data);
        setCommentCount(data.data.length);
      }
    } catch {
      setMessage('Komentar belum bisa dimuat.');
    } finally {
      setCommentsLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    async function fetchLikeStatus() {
      try {
        const response = await fetch(`/api/likes?article_id=${articleId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.success) {
          setLiked(Boolean(data.data.liked));
          setLikeCount(Number(data.data.like_count) || 0);
        }
      } catch {}
    }

    fetchLikeStatus();
    fetchComments();
  }, [articleId, fetchComments]);

  async function toggleLike() {
    if (!currentUser) {
      setMessage(`Login Telegram member untuk menyukai ${contentLabel}.`);
      return;
    }
    if (likePending) return;
    setLikePending(true);
    setMessage(null);
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setMessage(data.error?.message || 'Suka gagal diproses.');
        return;
      }
      setLiked(Boolean(data.data.liked));
      setLikeCount(Number(data.data.like_count) || 0);
    } catch {
      setMessage('Suka gagal diproses.');
    } finally {
      setLikePending(false);
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = comment.trim();
    if (!currentUser) {
      setMessage(`Login Telegram member untuk ikut berdiskusi di ${contentLabel}.`);
      return;
    }
    if (!content) {
      setMessage('Komentar tidak boleh kosong.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          content,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setMessage(data.error?.message || 'Komentar gagal dikirim.');
        return;
      }

      setComments((items) => [...items, data.data]);
      setCommentCount((count) => count + 1);
      setComment('');
      setMessage('Komentar terkirim.');
    } catch {
      setMessage('Komentar gagal dikirim.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    await copyShareLinkWithFeedback(url, showToast);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.actions} aria-label={`Aksi ${contentLabel}`}>
        <a href="#comments" aria-label="Lihat komentar">
          <CommentIcon />
          <span>Komentar</span>
          {commentCount}
        </a>
        <button
          type="button"
          className={liked ? styles.active : ''}
          onClick={toggleLike}
          disabled={likePending}
          aria-label={liked ? `Batal suka ${contentLabel}` : `Suka ${contentLabel}`}
          aria-pressed={liked}
        >
          <LoveIcon />
          <span>Suka</span>
          {likeCount}
        </button>
        <button
          type="button"
          onClick={copyLink}
          aria-label={`Bagikan ${contentLabel}`}
        >
          <ShareIcon />
          <span>Bagikan</span>
        </button>
      </div>

      {message ? <p className={styles.message}>{message}</p> : null}

      <section id="comments" className={styles.section} aria-label="Komentar">
        <div className={styles.sectionHeader}>
          <h2><CommentIcon /> Komentar</h2>
          <span>{commentsLoading ? '...' : commentCount}</span>
        </div>

        {!currentUser ? (
          <div className={styles.guestCta}>
            <strong>Login Telegram untuk ikut diskusi</strong>
            <p>Komentar dan suka hanya tersedia untuk member yang sudah login.</p>
            <HertzTelegramLogin compact />
          </div>
        ) : (
          <form className={styles.form} onSubmit={submitComment}>
          <label htmlFor="outlook-comment-body">Tulis komentar</label>
          <textarea
            id="outlook-comment-body"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Tambahkan sudut pandang Anda"
            rows={3}
            maxLength={2000}
          />
          <div className={styles.formFooter}>
            <span>{comment.trim().length}/2000</span>
            <button type="submit" disabled={submitting}>{submitting ? 'Mengirim...' : 'Balas'}</button>
          </div>
          </form>
        )}

        <div className={styles.list}>
          {commentsLoading ? (
            <p className={styles.empty}>Memuat komentar...</p>
          ) : comments.length > 0 ? (
            comments.map((item) => (
              <article key={item.id} className={styles.item}>
                <div className={styles.avatar} aria-hidden="true">
                  {(item.display_name.trim().charAt(0) || 'A').toUpperCase()}
                </div>
                <div>
                  <div className={styles.itemTop}>
                    <strong>{item.display_name}</strong>
                    <span>{formatCommentDate(item.created_at)}</span>
                    {!item.is_anonymous && item.user_id ? <span>Member</span> : null}
                  </div>
                  <p>{item.content}</p>
                </div>
              </article>
            ))
          ) : (
            <p className={styles.empty}>Belum ada komentar.</p>
          )}
        </div>
      </section>
    </div>
  );
}
