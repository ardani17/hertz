'use client';

import { useState } from 'react';
import type { MemberSessionUser, HertzPost } from '@shared/types';
import { Button } from '@/components/ui/button';
import { shouldOpenDesktopPostModal } from '@/lib/hertzPostDetailUi';
import { BookmarkIcon, CommentIcon, LoveIcon, RepostIcon, ShareIcon } from './HertzIcons';
import { HertzShareSheet } from './HertzShareSheet';
import styles from './HertzActionBar.module.css';

export function HertzActionBar({
  post,
  currentUser,
  enableDetailModal = true,
  onOpenDetail,
}: {
  post: HertzPost;
  currentUser: MemberSessionUser | null;
  enableDetailModal?: boolean;
  onOpenDetail?: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pulsed, setPulsed] = useState(post.viewer.hasPulsed);
  const [pulses, setPulses] = useState(post.counts.pulses);
  const [bookmarked, setBookmarked] = useState(post.viewer.hasBookmarked);
  const [reposted, setReposted] = useState(post.viewer.hasReposted);
  const [reposts, setReposts] = useState(post.counts.reposts);
  const [shareOpen, setShareOpen] = useState(false);

  function requireLogin() {
    if (!currentUser) {
      setMessage('Login Telegram member untuk memakai fitur ini.');
      return false;
    }
    return true;
  }

  async function postAction(path: string) {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Aksi gagal.');
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
      setMessage(data?.error?.message ?? 'Aksi gagal.');
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
      setBookmarked(Boolean(result.data.active));
      setMessage(result.data.active ? 'Postingan disimpan.' : 'Bookmark dibatalkan.');
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
      setMessage(active ? 'Postingan direpost.' : 'Repost dibatalkan.');
    }
  }

  function openComments() {
    const detailUrl = `/hertz/post/${post.shortId}#comments`;
    if (enableDetailModal && onOpenDetail && shouldOpenDesktopPostModal(window.innerWidth)) {
      onOpenDetail();
      return;
    }
    window.location.href = detailUrl;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.actions}>
        <Button type="button" variant="ghost" size="sm" onClick={openComments} aria-label="Komentar"><CommentIcon /> <span>Komentar</span> {post.counts.comments}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={togglePulse} className={pulsed ? styles.active : ''} disabled={pendingAction === 'pulse'} aria-label={pulsed ? 'Batal suka' : 'Suka'} aria-pressed={pulsed}><LoveIcon /> <span>Suka</span> {pulses}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={toggleRepost} className={reposted ? styles.active : ''} disabled={pendingAction === 'repost'} aria-label={reposted ? 'Batal repost' : 'Repost'} aria-pressed={reposted}><RepostIcon /> <span>Repost</span> {reposts}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={toggleBookmark} className={bookmarked ? styles.active : ''} disabled={pendingAction === 'bookmark'} aria-label={bookmarked ? 'Batal bookmark' : 'Bookmark'} aria-pressed={bookmarked}><BookmarkIcon /> <span>Simpan</span></Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShareOpen(true)} aria-label="Bagikan postingan" aria-haspopup="dialog"><ShareIcon /> <span>Bagikan</span></Button>
      </div>
      {message ? <p className={styles.message}>{message}</p> : null}
      {shareOpen ? (
        <HertzShareSheet post={post} onClose={() => setShareOpen(false)} onMessage={setMessage} />
      ) : null}
    </div>
  );
}
