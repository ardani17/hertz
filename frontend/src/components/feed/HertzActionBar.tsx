'use client';

import { useState } from 'react';
import type { MemberSessionUser, HertzPost } from '@shared/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toast';
import { buildCanonicalPostUrl, copyShareLinkWithFeedback } from '@/lib/shareLink';
import { BookmarkIcon, CommentIcon, LoveIcon, RepostIcon, ShareIcon } from './HertzIcons';
import styles from './HertzActionBar.module.css';

export function HertzActionBar({
  post,
  currentUser,
  onOpenDetail,
}: {
  post: HertzPost;
  currentUser: MemberSessionUser | null;
  onOpenDetail?: () => void;
}) {
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pulsed, setPulsed] = useState(post.viewer.hasPulsed);
  const [pulses, setPulses] = useState(post.counts.pulses);
  const [bookmarked, setBookmarked] = useState(post.viewer.hasBookmarked);
  const [reposted, setReposted] = useState(post.viewer.hasReposted);
  const [reposts, setReposts] = useState(post.counts.reposts);

  function requireLogin() {
    if (!currentUser) {
      showToast('Login Telegram member untuk memakai fitur ini.', 'warning');
      return false;
    }
    return true;
  }

  async function postAction(path: string) {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      showToast(data?.error?.message ?? 'Aksi gagal.', 'error');
      return null;
    }
    return response.json();
  }

  async function postTypedAction(path: string, body: object) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      showToast(data?.error?.message ?? 'Aksi gagal.', 'error');
      return null;
    }
    return response.json();
  }

  async function togglePulse() {
    if (!requireLogin()) return;
    setPendingAction('pulse');
    const result = await postAction(`/api/hertz/posts/${post.shortId}/pulse`);
    setPendingAction(null);
    if (result) {
      const active = Boolean(result.data.active);
      setPulsed(active);
      setPulses((count) => Math.max(0, count + (active ? 1 : -1)));
    }
  }

  async function toggleBookmark() {
    if (!requireLogin()) return;
    setPendingAction('bookmark');
    const result = await postAction(`/api/hertz/posts/${post.shortId}/bookmark`);
    setPendingAction(null);
    if (result) {
      const active = Boolean(result.data.active);
      setBookmarked(active);
      showToast(active ? 'Postingan disimpan.' : 'Bookmark dibatalkan.', 'success');
    }
  }

  async function toggleRepost() {
    if (!requireLogin()) return;
    setPendingAction('repost');
    const result = await postTypedAction(`/api/hertz/posts/${post.shortId}/repost`, { type: 'repost' });
    setPendingAction(null);
    if (result) {
      const active = Boolean(result.data.active);
      setReposted(active);
      setReposts((count) => Math.max(0, count + (active ? 1 : -1)));
      showToast(active ? 'Postingan direpost.' : 'Repost dibatalkan.', 'success');
    }
  }

  function openComments() {
    if (onOpenDetail) {
      onOpenDetail();
      requestAnimationFrame(() => {
        document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    window.location.assign(`/hertz/post/${post.shortId}#comments`);
  }

  async function copyShareLink() {
    await copyShareLinkWithFeedback(
      buildCanonicalPostUrl(post.shortId, window.location.origin),
      showToast,
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.actions}>
        <Button type="button" variant="ghost" size="sm" onClick={openComments} aria-label={`Komentar, ${post.counts.comments} komentar`}>
          <CommentIcon /> <span>Komentar</span> {post.counts.comments}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={togglePulse} className={pulsed ? styles.active : ''} disabled={pendingAction === 'pulse'} aria-label={pulsed ? 'Batal suka' : 'Suka'} aria-pressed={pulsed}>
          <LoveIcon /> <span>Suka</span> {pulses}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={toggleRepost} className={reposted ? styles.active : ''} disabled={pendingAction === 'repost'} aria-label={reposted ? 'Batal repost' : 'Repost'} aria-pressed={reposted}>
          <RepostIcon /> <span>Repost</span> {reposts}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={toggleBookmark} className={bookmarked ? styles.active : ''} disabled={pendingAction === 'bookmark'} aria-label={bookmarked ? 'Batal bookmark' : 'Bookmark'} aria-pressed={bookmarked}>
          <BookmarkIcon /> <span>Simpan</span>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={copyShareLink} aria-label="Bagikan postingan">
          <ShareIcon /> <span>Bagikan</span>
        </Button>
      </div>
    </div>
  );
}
