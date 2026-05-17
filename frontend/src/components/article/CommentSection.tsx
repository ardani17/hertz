'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { HertzTelegramLogin } from '@/components/feed/HertzTelegramLogin';
import styles from './CommentSection.module.css';

interface CommentData {
  id: string;
  display_name: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  user_id: string | null;
}

interface CommentSectionProps {
  articleId: string;
  currentUser?: MemberSessionUser | null;
}

/** Format a date string to a human-readable format */
function formatCommentDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * CommentSection — displays chronological comments (oldest first)
 * and provides a form to submit new comments for logged-in members only.
 */
export function CommentSection({ articleId, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [member, setMember] = useState<MemberSessionUser | null>(currentUser ?? null);

  // Form state
  const [content, setContent] = useState('');

  useEffect(() => {
    setMember(currentUser ?? null);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser !== undefined) return;
    async function fetchMember() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) return;
        const data = await response.json();
        setMember(data.success ? data.data.user ?? null : null);
      } catch {}
    }
    fetchMember();
  }, [currentUser]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?article_id=${articleId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch {
      // Silently fail — comments are non-critical
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!member) {
      setError('Login member diperlukan untuk komentar.');
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('Isi komentar tidak boleh kosong.');
      return;
    }

    if (trimmedContent.length > 2000) {
      setError('Komentar maksimal 2000 karakter.');
      return;
    }

    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        article_id: articleId,
        content: trimmedContent,
      };

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Gagal mengirim komentar.');
        return;
      }

      // Add new comment to list
      setComments((prev) => [...prev, data.data]);
      setContent('');
      setSuccess('Komentar berhasil dikirim!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Gagal mengirim komentar. Coba lagi nanti.');
    } finally {
      setSubmitting(false);
    }
  }, [articleId, content, member]);

  return (
    <section className={styles.section} aria-label="Komentar">
      <h2 className={styles.heading}>
        💬 Komentar ({loading ? '…' : comments.length})
      </h2>

      {/* Comment List */}
      {loading ? (
        <div className={styles.emptyComments}>Memuat komentar…</div>
      ) : comments.length === 0 ? (
        <div className={styles.emptyComments}>
          Belum ada komentar. Jadilah yang pertama berkomentar!
        </div>
      ) : (
        <div className={styles.commentList} role="list">
          {comments.map((comment) => (
            <div key={comment.id} className={styles.comment} role="listitem">
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>
                  {comment.display_name}
                </span>
                {!comment.is_anonymous && comment.user_id && (
                  <span className={styles.memberBadge} aria-label="Member terverifikasi">
                    ✓ Member
                  </span>
                )}
                <time
                  className={styles.commentDate}
                  dateTime={comment.created_at}
                >
                  {formatCommentDate(comment.created_at)}
                </time>
              </div>
              <p className={styles.commentContent}>{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comment Form */}
      <div className={styles.formSection}>
        <h3 className={styles.formTitle}>Tulis Komentar</h3>

        {!member ? (
          <div className={styles.memberOnly}>
            <strong>Login Telegram untuk ikut diskusi</strong>
            <p>Komentar hanya tersedia untuk member yang sudah login.</p>
            <HertzTelegramLogin compact />
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="comment-content" className={styles.label}>
              Komentar
            </label>
            <textarea
              id="comment-content"
              className={styles.textarea}
              placeholder="Tulis komentar Anda…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              required
            />
          </div>

          {error && <p className={styles.errorMessage} role="alert">{error}</p>}
          {success && <p className={styles.successMessage} role="status">{success}</p>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? 'Mengirim…' : 'Kirim Komentar'}
          </button>
          </form>
        )}
      </div>
    </section>
  );
}
