'use client';

import { useState, type FormEvent } from 'react';
import type { CommunityNote, MemberSessionUser, SignalComment, SignalPostDetail } from '@shared/types';
import { CommentIcon, UsersIcon } from './SignalIcons';
import styles from './SignalDetailInteractions.module.css';

export function SignalDetailInteractions({
  post,
  currentUser,
}: {
  post: SignalPostDetail;
  currentUser: MemberSessionUser | null;
}) {
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
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
    const response = await fetch(`/api/feed/${post.id}/comments`, {
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

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireLogin()) return;
    const content = note.trim();
    const url = sourceUrl.trim();
    if (!content || !url) {
      setMessage('Catatan komunitas wajib berisi konteks dan source URL.');
      return;
    }
    setPending('note');
    const response = await fetch(`/api/feed/${post.id}/community-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sources: [{ url }] }),
    });
    setPending(null);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Catatan komunitas gagal dikirim.');
      return;
    }
    window.location.reload();
  }

  async function deleteComment(commentId: string) {
    if (!requireLogin()) return;
    const response = await fetch(`/api/feed/comments/${commentId}`, { method: 'DELETE' });
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
    const response = await fetch(`/api/feed/comments/${commentId}`, {
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

  async function deleteNote(noteId: string) {
    if (!requireLogin()) return;
    const response = await fetch(`/api/feed/community-notes/${noteId}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Catatan gagal dihapus.');
      return;
    }
    window.location.reload();
  }

  async function editNote(noteId: string, content: string) {
    if (!requireLogin()) return;
    const cleaned = content.trim();
    if (!cleaned) {
      setMessage('Catatan komunitas tidak boleh kosong.');
      return;
    }
    const response = await fetch(`/api/feed/community-notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: cleaned }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Catatan gagal diedit.');
      return;
    }
    window.location.reload();
  }

  async function rateNote(noteId: string, rating: 'helpful' | 'not_helpful') {
    if (!requireLogin()) return;
    const response = await fetch(`/api/feed/community-notes/${noteId}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Rating gagal disimpan.');
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

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2><UsersIcon /> Catatan komunitas</h2>
          <span>{post.communityNotes.length}</span>
        </div>
        <form className={styles.form} onSubmit={submitNote}>
          <label htmlFor={`note-${post.id}`}>Tambahkan koreksi atau konteks</label>
          <textarea
            id={`note-${post.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onFocus={requireLogin}
            placeholder={currentUser ? 'Tulis konteks yang membantu pembaca' : 'Login untuk menulis catatan'}
            rows={4}
            maxLength={4000}
          />
          <label htmlFor={`source-${post.id}`}>Source URL wajib</label>
          <input
            id={`source-${post.id}`}
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            onFocus={requireLogin}
            placeholder="https://..."
            inputMode="url"
          />
          <div className={styles.formFooter}>
            <span>{note.trim().length}/4000</span>
            <button type="submit" disabled={pending === 'note'}>{pending === 'note' ? 'Mengirim...' : 'Publish note'}</button>
          </div>
        </form>
        <div className={styles.list}>
          {post.communityNotes.length > 0
            ? post.communityNotes.map((item) => (
              <NoteItem
                key={item.id}
                note={item}
                currentUser={currentUser}
                onDelete={() => deleteNote(item.id)}
                onEdit={(content) => editNote(item.id, content)}
                onRate={(rating) => rateNote(item.id, rating)}
              />
            ))
            : <p className={styles.empty}>Belum ada catatan komunitas.</p>}
        </div>
      </section>
    </div>
  );
}

function CommentItem({ comment, onDelete, onEdit }: { comment: SignalComment; onDelete: () => void; onEdit: (content: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  return (
    <article className={styles.item}>
      <div className={styles.avatar}>{comment.author.name.slice(0, 1).toUpperCase()}</div>
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

function NoteItem({
  note,
  currentUser,
  onDelete,
  onEdit,
  onRate,
}: {
  note: CommunityNote;
  currentUser: MemberSessionUser | null;
  onDelete: () => void;
  onEdit: (content: string) => void;
  onRate: (rating: 'helpful' | 'not_helpful') => void;
}) {
  const canDelete = Boolean(currentUser && (currentUser.id === note.authorId || currentUser.role === 'admin'));
  const canEdit = canDelete;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);

  return (
    <article className={styles.note}>
      <div className={styles.itemTop}>
        <strong>{note.authorName}</strong>
        <span>{note.helpfulCount} helpful</span>
        <span>{note.notHelpfulCount} not helpful</span>
      </div>
      {editing ? (
        <form className={styles.inlineEdit} onSubmit={(event) => { event.preventDefault(); onEdit(draft); }}>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} maxLength={4000} />
          <div>
            <button type="button" onClick={() => { setDraft(note.content); setEditing(false); }}>Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      ) : <p>{note.content}</p>}
      <div className={styles.sources}>
        {note.sources.map((source) => (
          <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title || source.url}</a>
        ))}
      </div>
      <div className={styles.noteActions}>
        <button type="button" className={note.viewerRating === 'helpful' ? styles.active : ''} onClick={() => onRate('helpful')}>Helpful</button>
        <button type="button" className={note.viewerRating === 'not_helpful' ? styles.active : ''} onClick={() => onRate('not_helpful')}>Not helpful</button>
        {canEdit ? <button type="button" onClick={() => setEditing((value) => !value)}>Edit</button> : null}
        {canDelete ? <button type="button" onClick={onDelete}>Delete</button> : null}
      </div>
    </article>
  );
}
