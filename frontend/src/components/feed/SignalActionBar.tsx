'use client';

import { useState, type FormEvent } from 'react';
import type { MemberSessionUser, SignalPost } from '@shared/types';
import { Button } from '@/components/ui/button';
import { BookmarkIcon, CommentIcon, InsightIcon, RepostIcon, ShareIcon, SignalIcon } from './SignalIcons';
import styles from './SignalActionBar.module.css';

export function SignalActionBar({ post, currentUser }: { post: SignalPost; currentUser: MemberSessionUser | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteContent, setQuoteContent] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pulsed, setPulsed] = useState(post.viewer.hasPulsed);
  const [bookmarked, setBookmarked] = useState(post.viewer.hasBookmarked);
  const [reposted, setReposted] = useState(post.viewer.hasReposted);
  const [pulses, setPulses] = useState(post.counts.pulses);
  const [reposts, setReposts] = useState(post.counts.reposts);

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
    if (result) setBookmarked(Boolean(result.data.active));
  }

  async function repost() {
    if (!requireLogin()) return;
    setPendingAction('repost');
    const response = await fetch(`/api/hertz/posts/${post.shortId}/repost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'repost' }),
    });
    setPendingAction(null);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Repost gagal.');
      return;
    }
    const payload = await response.json().catch(() => null);
    const active = Boolean(payload?.data?.active);
    setReposted(active);
    setReposts((count) => Math.max(0, count + (active ? 1 : -1)));
    setMessage(active ? 'Repost aktif.' : 'Repost dibatalkan.');
  }

  async function sharePost() {
    const url = `${window.location.origin}/hertz/post/${post.shortId}`;
    if (navigator.share) {
      await navigator.share({ title: 'HERTZ post', url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url);
    setMessage('Link disalin.');
  }

  function openQuoteComposer() {
    if (!requireLogin()) return;
    setQuoteOpen((value) => !value);
    setMessage(null);
  }

  async function quoteRepost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireLogin()) return;
    const content = quoteContent.trim();
    if (!content) {
      setMessage('Tulis komentar quote terlebih dahulu.');
      return;
    }
    setSubmittingQuote(true);
    const response = await fetch(`/api/hertz/posts/${post.shortId}/repost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'quote', content }),
    });
    setSubmittingQuote(false);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Quote repost gagal.');
      return;
    }
    setQuoteContent('');
    setQuoteOpen(false);
    setMessage('Quote repost dipublikasikan.');
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.actions}>
        <Button type="button" variant="ghost" size="sm" onClick={() => (currentUser ? window.location.assign(`/hertz/post/${post.shortId}#comments`) : requireLogin())} aria-label="Komentar"><CommentIcon /> <span>Comment</span> {post.counts.comments}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={repost} className={reposted ? styles.active : ''} disabled={pendingAction === 'repost'} aria-label="Repost"><RepostIcon /> <span>Repost</span> {reposts}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={openQuoteComposer} aria-label="Quote repost"><RepostIcon /> <span>Quote</span></Button>
        <Button type="button" variant="ghost" size="sm" onClick={togglePulse} className={pulsed ? styles.active : ''} disabled={pendingAction === 'pulse'} aria-label="Pulse"><SignalIcon /> <span>Pulse</span> {pulses}</Button>
        <a href={`/hertz/post/${post.shortId}`} aria-label="Insight"><InsightIcon /> <span>Insight</span> {post.counts.views}</a>
        <Button type="button" variant="ghost" size="sm" onClick={toggleBookmark} className={bookmarked ? styles.active : ''} disabled={pendingAction === 'bookmark'} aria-label="Simpan"><BookmarkIcon /> <span>Save</span></Button>
        <Button type="button" variant="ghost" size="sm" onClick={sharePost} aria-label="Bagikan"><ShareIcon /> <span>Share</span></Button>
      </div>
      {quoteOpen ? (
        <form className={styles.quoteForm} onSubmit={quoteRepost}>
          <label htmlFor={`quote-${post.id}`}>Quote repost</label>
          <textarea
            id={`quote-${post.id}`}
            value={quoteContent}
            onChange={(event) => setQuoteContent(event.target.value)}
            maxLength={4000}
            placeholder="Tambahkan konteks singkat untuk repost ini"
            rows={3}
          />
          <div className={styles.quoteFooter}>
            <span>{quoteContent.trim().length}/4000</span>
            <Button type="submit" disabled={submittingQuote}>{submittingQuote ? 'Mengirim...' : 'Publish quote'}</Button>
          </div>
        </form>
      ) : null}
      {message ? <p className={styles.message}>{message}</p> : null}
    </div>
  );
}
