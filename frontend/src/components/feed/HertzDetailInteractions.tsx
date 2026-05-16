'use client';

import { useState, type FormEvent } from 'react';
import type { MemberSessionUser, HertzComment, HertzPostDetail } from '@shared/types';
import { HertzAvatar } from './HertzAvatar';
import { CommentIcon } from './HertzIcons';
import styles from './HertzDetailInteractions.module.css';

export function HertzDetailInteractions({
  post,
  currentUser,
}: {
  post: HertzPostDetail;
  currentUser: MemberSessionUser | null;
}) {
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  function requireLogin() {
    if (!currentUser) {
      setMessage('Login Telegram member untuk ikut berdiskusi.');
      return false;
    }
    return true;
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireLogin()) return;
    const content = comment.trim();
    if (!content) {
      setMessage('Komentar tidak boleh kosong.');
      return;
    }
    setPending('comment');
    const response = await fetch(`/api/hertz/posts/${post.shortId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setPending(null);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Komentar gagal dikirim.');
      return;
    }
    window.location.reload();
  }

  async function deleteComment(commentId: string) {
    if (!requireLogin()) return;
    const response = await fetch(`/api/hertz/posts/comments/${commentId}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Komentar gagal dihapus.');
      return;
    }
    window.location.reload();
  }

  async function editComment(commentId: string, content: string) {
    if (!requireLogin()) return;
    const cleaned = content.trim();
    if (!cleaned) {
      setMessage('Komentar tidak boleh kosong.');
      return;
    }
    const response = await fetch(`/api/hertz/posts/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: cleaned }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Komentar gagal diedit.');
      return;
    }
    window.location.reload();
  }

  return (
    <div className={styles.wrap}>
      {message ? <p className={styles.message}>{message}</p> : null}
      <section id="comments" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2><CommentIcon /> Komentar</h2>
          <span>{post.comments.length}</span>
        </div>
        <form className={styles.form} onSubmit={submitComment}>
          <label htmlFor={`comment-${post.id}`}>Tulis komentar</label>
          <textarea
            id={`comment-${post.id}`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            onFocus={requireLogin}
            placeholder={currentUser ? 'Tambahkan sudut pandang Anda' : 'Login untuk komentar'}
            rows={3}
            maxLength={2000}
          />
          <div className={styles.formFooter}>
            <span>{comment.trim().length}/2000</span>
            <button type="submit" disabled={pending === 'comment'}>{pending === 'comment' ? 'Mengirim...' : 'Reply'}</button>
          </div>
        </form>
        <div className={styles.list}>
          {post.comments.length > 0
            ? post.comments.map((item) => (
              <CommentItem key={item.id} comment={item} onDelete={() => deleteComment(item.id)} onEdit={(content) => editComment(item.id, content)} />
            ))
            : <p className={styles.empty}>Belum ada komentar.</p>}
        </div>
      </section>

    </div>
  );
}

function CommentItem({ comment, onDelete, onEdit }: { comment: HertzComment; onDelete: () => void; onEdit: (content: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  return (
    <article className={styles.item}>
      <HertzAvatar
        className={styles.avatar}
        src={comment.author.avatarUrl}
        name={comment.author.name}
        username={comment.author.username}
      />
      <div>
        <div className={styles.itemTop}>
          <strong>{comment.author.name}</strong>
          <span>{new Date(comment.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          {comment.editedAt ? <span>Edited</span> : null}
        </div>
        {editing ? (
          <form className={styles.inlineEdit} onSubmit={(event) => { event.preventDefault(); onEdit(draft); }}>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={2000} />
            <div>
              <button type="button" onClick={() => { setDraft(comment.content); setEditing(false); }}>Cancel</button>
              <button type="submit">Save</button>
            </div>
          </form>
        ) : <p>{comment.content}</p>}
        <div className={styles.inlineActions}>
          {comment.canEdit ? <button type="button" className={styles.textButton} onClick={() => setEditing((value) => !value)}>Edit</button> : null}
          {comment.canDelete ? <button type="button" className={styles.textButton} onClick={onDelete}>Delete</button> : null}
        </div>
      </div>
    </article>
  );
}
