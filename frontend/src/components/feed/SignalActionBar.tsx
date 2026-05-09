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
  const [pulsed, setPulsed] = useState(post.viewer.hasPulsed);
  const [bookmarked, setBookmarked] = useState(post.viewer.hasBookmarked);
  const [pulses, setPulses] = useState(post.counts.pulses);

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
    const result = await postAction(`/api/hertz/posts/${post.shortId}/pulse`);
    if (result) {
      const active = Boolean(result.data.active);
      setPulsed(active);
      setPulses((count) => Math.max(0, count + (active ? 1 : -1)));
    }
  }

  async function toggleBookmark() {
    if (!requireLogin()) return;
    const result = await postAction(`/api/hertz/posts/${post.shortId}/bookmark`);
    if (result) setBookmarked(Boolean(result.data.active));
  }

  async function repost() {
    if (!requireLogin()) return;
    const response = await fetch(`/api/hertz/posts/${post.shortId}/repost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'repost' }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Repost gagal.');
      return;
    }
    setMessage('Repost diperbarui.');
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
        <Button type="button" variant="ghost" size="sm" onClick={repost} aria-label="Repost"><RepostIcon /> <span>Repost</span> {post.counts.reposts}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={openQuoteComposer} aria-label="Quote repost"><RepostIcon /> <span>Quote</span></Button>
        <Button type="button" variant="ghost" size="sm" onClick={togglePulse} className={pulsed ? styles.active : ''} aria-label="Pulse"><SignalIcon /> <span>Pulse</span> {pulses}</Button>
        <a href={`/hertz/post/${post.shortId}`} aria-label="Insight"><InsightIcon /> <span>Insight</span> {post.counts.views}</a>
        <Button type="button" variant="ghost" size="sm" onClick={toggleBookmark} className={bookmarked ? styles.active : ''} aria-label="Simpan"><BookmarkIcon /> <span>Save</span></Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/hertz/post/${post.shortId}`)} aria-label="Bagikan"><ShareIcon /> <span>Share</span></Button>
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
