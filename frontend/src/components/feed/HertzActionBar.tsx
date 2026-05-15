'use client';

import { useState } from 'react';
import type { MemberSessionUser, HertzPost } from '@shared/types';
import { Button } from '@/components/ui/button';
import { CommentIcon, LoveIcon } from './HertzIcons';
import styles from './HertzActionBar.module.css';

export function HertzActionBar({ post, currentUser }: { post: HertzPost; currentUser: MemberSessionUser | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pulsed, setPulsed] = useState(post.viewer.hasPulsed);
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
    setPendingAction('pulse');
    const result = await postAction(`/api/hertz/posts/${post.shortId}/pulse`);
    setPendingAction(null);
    if (result) {
      const active = Boolean(result.data.active);
      setPulsed(active);
      setPulses((count) => Math.max(0, count + (active ? 1 : -1)));
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.actions}>
        <a href={`/hertz/post/${post.shortId}#comments`} aria-label="Komentar"><CommentIcon /> <span>Komentar</span> {post.counts.comments}</a>
        <Button type="button" variant="ghost" size="sm" onClick={togglePulse} className={pulsed ? styles.active : ''} disabled={pendingAction === 'pulse'} aria-label={pulsed ? 'Batal suka' : 'Suka'} aria-pressed={pulsed}><LoveIcon /> <span>Suka</span> {pulses}</Button>
      </div>
      {message ? <p className={styles.message}>{message}</p> : null}
    </div>
  );
}
