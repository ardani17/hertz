'use client';

import { useState, type FormEvent } from 'react';
import type { MemberSessionUser, HertzComment, HertzPostDetail } from '@shared/types';
import { HertzAvatar } from './HertzAvatar';
import { CommentIcon } from './HertzIcons';
import { HertzTelegramLogin } from './HertzTelegramLogin';
import styles from './HertzDetailInteractions.module.css';

export function getHertzCommentComposerState(user: Pick<MemberSessionUser, 'id'> | null, pending: boolean) {
  if (!user) {
    return {
      mode: 'guest' as const,
      title: 'Login Telegram untuk ikut diskusi',
      body: 'Komentar hanya tersedia untuk member yang sudah login.',
      submitLabel: 'Login Telegram',
    };
  }

  return {
    mode: 'member' as const,
    title: 'Tulis komentar',
    body: 'Tambahkan sudut pandang Anda',
    submitLabel: pending ? 'Mengirim...' : 'Balas',
  };
}

export function HertzDetailInteractions({
  post,
  currentUser,
}: {
  post: HertzPostDetail;
  currentUser: MemberSessionUser | null;
}) {
  const [comment, setComment] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const composerState = getHertzCommentComposerState(currentUser, pending === 'comment');

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
    try {
      setPending('comment');
      const response = await fetch(`/api/hertz/posts/${post.shortId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.error?.message ?? 'Komentar gagal dikirim.');
        return;
      }
      setMessage('Komentar terkirim.');
      window.location.reload();
    } catch {
      setMessage('Komentar gagal dikirim.');
    } finally {
      setPending(null);
    }
  }

  async function submitReply(parentCommentId: string) {
    if (!requireLogin()) return;
    const content = replyDraft.trim();
    if (!content) {
      setMessage('Balasan tidak boleh kosong.');
      return;
    }
    try {
      setPending(`reply-${parentCommentId}`);
      const response = await fetch(`/api/hertz/posts/${post.shortId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentCommentId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.error?.message ?? 'Balasan gagal dikirim.');
        return;
      }
      setMessage('Balasan terkirim.');
      window.location.reload();
    } catch {
      setMessage('Balasan gagal dikirim.');
    } finally {
      setPending(null);
    }
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
        {composerState.mode === 'guest' ? (
          <div className={styles.guestCta}>
            <strong>{composerState.title}</strong>
            <p>{composerState.body}</p>
            <HertzTelegramLogin />
          </div>
        ) : (
          <form className={styles.form} onSubmit={submitComment}>
            <label htmlFor={`comment-${post.id}`}>{composerState.title}</label>
            <textarea
              id={`comment-${post.id}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={composerState.body}
              rows={3}
              maxLength={2000}
            />
            <div className={styles.formFooter}>
              <span>{comment.trim().length}/2000</span>
              <button type="submit" disabled={pending === 'comment'}>{composerState.submitLabel}</button>
            </div>
          </form>
        )}
        <div className={styles.list}>
          {post.comments.length > 0
            ? post.comments.map((item) => (
              <CommentItem key={item.id} comment={item} currentUser={currentUser} replyDraft={replyTargetId === item.id ? replyDraft : ''} replyOpen={replyTargetId === item.id} replyPending={pending === `reply-${item.id}`} onToggleReply={() => { setReplyTargetId((value) => value === item.id ? null : item.id); setReplyDraft(''); }} onReplyDraftChange={setReplyDraft} onSubmitReply={() => submitReply(item.id)} onDeleteComment={deleteComment} onEditComment={editComment} />
            ))
            : <p className={styles.empty}>Belum ada komentar.</p>}
        </div>
      </section>

    </div>
  );
}

function CommentItem({ comment, currentUser, replyDraft, replyOpen, replyPending, onToggleReply, onReplyDraftChange, onSubmitReply, onDeleteComment, onEditComment }: { comment: HertzComment; currentUser: MemberSessionUser | null; replyDraft: string; replyOpen: boolean; replyPending: boolean; onToggleReply: () => void; onReplyDraftChange: (value: string) => void; onSubmitReply: () => void; onDeleteComment: (commentId: string) => void; onEditComment: (commentId: string, content: string) => void }) {
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
          {comment.editedAt ? <span>Diedit</span> : null}
        </div>
        {editing ? (
          <form className={styles.inlineEdit} onSubmit={(event) => { event.preventDefault(); onEditComment(comment.id, draft); }}>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={2000} />
            <div>
              <button type="button" onClick={() => { setDraft(comment.content); setEditing(false); }}>Batal</button>
              <button type="submit">Simpan</button>
            </div>
          </form>
        ) : <p>{comment.content}</p>}
        <div className={styles.inlineActions}>
          {currentUser ? <button type="button" className={styles.textButton} onClick={onToggleReply}>Balas</button> : null}
          {comment.canEdit ? <button type="button" className={styles.textButton} onClick={() => setEditing((value) => !value)}>Edit</button> : null}
          {comment.canDelete ? <button type="button" className={styles.textButton} onClick={() => onDeleteComment(comment.id)}>Hapus</button> : null}
        </div>
        {replyOpen ? (
          <form className={styles.replyForm} onSubmit={(event) => { event.preventDefault(); onSubmitReply(); }}>
            <textarea value={replyDraft} onChange={(event) => onReplyDraftChange(event.target.value)} rows={2} maxLength={2000} placeholder={`Balas ${comment.author.name}`} />
            <div><span>{replyDraft.trim().length}/2000</span><button type="submit" disabled={replyPending}>{replyPending ? 'Mengirim...' : 'Kirim balasan'}</button></div>
          </form>
        ) : null}
        {comment.replies.length > 0 ? (
          <div className={styles.replies}>
            {comment.replies.map((reply) => <ReplyItem key={reply.id} comment={reply} onDeleteComment={onDeleteComment} onEditComment={onEditComment} />)}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ReplyItem({ comment, onDeleteComment, onEditComment }: { comment: HertzComment; onDeleteComment: (commentId: string) => void; onEditComment: (commentId: string, content: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  return (
    <article className={styles.replyItem}>
      <HertzAvatar className={styles.avatar} src={comment.author.avatarUrl} name={comment.author.name} username={comment.author.username} />
      <div>
        <div className={styles.itemTop}><strong>{comment.author.name}</strong><span>{new Date(comment.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>{comment.editedAt ? <span>Diedit</span> : null}</div>
        {editing ? (
          <form className={styles.inlineEdit} onSubmit={(event) => { event.preventDefault(); onEditComment(comment.id, draft); }}>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={2000} />
            <div><button type="button" onClick={() => { setDraft(comment.content); setEditing(false); }}>Batal</button><button type="submit">Simpan</button></div>
          </form>
        ) : <p>{comment.content}</p>}
        <div className={styles.inlineActions}>{comment.canEdit ? <button type="button" className={styles.textButton} onClick={() => setEditing((value) => !value)}>Edit</button> : null}{comment.canDelete ? <button type="button" className={styles.textButton} onClick={() => onDeleteComment(comment.id)}>Hapus</button> : null}</div>
      </div>
    </article>
  );
}
