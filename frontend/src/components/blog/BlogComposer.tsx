'use client';

import { useRef, useState } from 'react';
import { Bold, Italic, Link, Send, SquarePen } from 'lucide-react';
import type { MemberSessionUser } from '@shared/types';
import styles from './BlogComposer.module.css';

export function BlogComposer({ currentUser }: { currentUser: MemberSessionUser | null }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function wrapSelection(before: string, after = before, placeholder = 'teks') {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((value) => `${value}${before}${placeholder}${after}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`;
    setContent(next);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  async function submit() {
    setMessage(null);
    if (!currentUser) {
      setMessage('Login Telegram member diperlukan.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setMessage('Judul dan isi blog wajib diisi.');
      return;
    }

    setSubmitting(true);
    const response = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    setSubmitting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Gagal publish blog.');
      return;
    }
    window.location.reload();
  }

  return (
    <section className={styles.composer} aria-label="Blog composer">
      <button className={styles.toggle} type="button" onClick={() => setOpen((value) => !value)}>
        <SquarePen />
        <span>{currentUser ? 'Tulis Blog' : 'Login untuk menulis Blog'}</span>
      </button>

      {open ? (
        <div className={styles.form}>
          <input
            className={styles.titleInput}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Judul blog"
            disabled={!currentUser || submitting}
          />

          <div className={styles.toolbar} aria-label="Format artikel">
            <button type="button" onClick={() => wrapSelection('*')} disabled={!currentUser || submitting} title="Bold">
              <Bold />
            </button>
            <button type="button" onClick={() => wrapSelection('_')} disabled={!currentUser || submitting} title="Italic">
              <Italic />
            </button>
            <button type="button" onClick={() => wrapSelection('', '', 'https://')} disabled={!currentUser || submitting} title="Link">
              <Link />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={currentUser ? 'Tulis artikel...' : 'Login Telegram member untuk menulis blog'}
            rows={8}
            disabled={!currentUser || submitting}
          />

          <div className={styles.footer}>
            <span className={styles.hint}>Gunakan *bold*, _italic_, dan URL mentah untuk link otomatis.</span>
            <button className={styles.submit} type="button" onClick={submit} disabled={submitting}>
              <Send />
              <span>{submitting ? 'Publishing...' : 'Publish'}</span>
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className={styles.message}>{message}</p> : null}
    </section>
  );
}
