'use client';

import { useState } from 'react';
import type { MemberSessionUser } from '@shared/types';

export function BlogComposer({ currentUser }: { currentUser: MemberSessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    if (!currentUser) {
      setMessage('Login Telegram member diperlukan.');
      return;
    }
    const response = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Gagal publish blog.');
      return;
    }
    window.location.reload();
  }

  return (
    <section style={{ border: '1px solid rgba(52,211,153,.28)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        {currentUser ? 'Tulis Blog' : 'Login untuk menulis Blog'}
      </button>
      {open ? (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Judul blog" />
          <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Tulis artikel..." rows={6} />
          <button type="button" onClick={submit}>Publish</button>
        </div>
      ) : null}
      {message ? <p>{message}</p> : null}
    </section>
  );
}
