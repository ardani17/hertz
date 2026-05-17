'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MemberSessionUser } from '@shared/types';
import styles from './LikeButton.module.css';

interface LikeButtonProps {
  articleId: string;
  initialLikeCount: number;
  currentUser?: MemberSessionUser | null;
}

/** Like button backed by logged-in member identity. */
export function LikeButton({ articleId, initialLikeCount, currentUser }: LikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [member, setMember] = useState<MemberSessionUser | null>(currentUser ?? null);

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

  useEffect(() => {
    async function fetchLikeStatus() {
      try {
        const res = await fetch(`/api/likes?article_id=${articleId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setLikeCount(data.data.like_count);
          setLiked(data.data.liked);
        }
      } catch {}
    }

    fetchLikeStatus();
  }, [articleId]);

  const toggleLike = useCallback(async () => {
    if (!member) {
      setMessage('Login member diperlukan untuk menyukai.');
      return;
    }
    if (loading) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error?.message || 'Suka gagal diproses.');
        return;
      }

      if (data.success) {
        setLiked(data.data.liked);
        setLikeCount(data.data.like_count);
      }
    } catch {
      setMessage('Suka gagal diproses.');
    } finally {
      setLoading(false);
    }
  }, [articleId, member, loading]);

  return (
    <span className={styles.wrap}>
      <button
        type="button"
        className={`${styles.likeButton} ${liked ? styles.liked : ''}`}
        onClick={toggleLike}
        disabled={loading}
        aria-label={liked ? 'Batal suka artikel ini' : 'Suka artikel ini'}
        aria-pressed={liked}
      >
        <span className={styles.heart} aria-hidden="true">
          {liked ? '❤️' : '🤍'}
        </span>
        <span className={styles.count}>{likeCount} suka</span>
      </button>
      {message ? <span className={styles.message}>{message}</span> : null}
    </span>
  );
}
