'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { MemberSessionUser, HertzPostDetail } from '@shared/types';
import { CommentList } from '@/features/hertz/comments/CommentList';
import { useToast } from '@/components/ui/Toast';
import { refreshPreserveScroll } from '@/lib/hertzRefresh';
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
  const router = useRouter();
  const { showToast } = useToast();
  const [comment, setComment] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const composerState = getHertzCommentComposerState(currentUser, pending === 'comment');

  function requireLogin() {
    if (!currentUser) {
      showToast('Login Telegram member untuk ikut berdiskusi.', 'warning');
      return false;
    }
    return true;
  }

  function afterMutation(message: string) {
    showToast(message, 'success');
    refreshPreserveScroll(router);
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireLogin()) return;
    const content = comment.trim();
    if (!content) {
      showToast('Komentar tidak boleh kosong.', 'warning');
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
        showToast(data?.error?.message ?? 'Komentar gagal dikirim.', 'error');
        return;
      }
      setComment('');
      afterMutation('Komentar terkirim.');
    } catch {
      showToast('Komentar gagal dikirim.', 'error');
    } finally {
      setPending(null);
    }
  }

  async function submitReply(parentCommentId: string) {
    if (!requireLogin()) return;
    const content = replyDraft.trim();
    if (!content) {
      showToast('Balasan tidak boleh kosong.', 'warning');
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
        showToast(data?.error?.message ?? 'Balasan gagal dikirim.', 'error');
        return;
      }
      setReplyDraft('');
      setReplyTargetId(null);
      afterMutation('Balasan terkirim.');
    } catch {
      showToast('Balasan gagal dikirim.', 'error');
    } finally {
      setPending(null);
    }
  }

  async function deleteComment(commentId: string) {
    if (!requireLogin()) return;
    const response = await fetch(`/api/hertz/posts/comments/${commentId}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      showToast(data?.error?.message ?? 'Komentar gagal dihapus.', 'error');
      return;
    }
    afterMutation('Komentar dihapus.');
  }

  async function editComment(commentId: string, content: string) {
    if (!requireLogin()) return;
    const cleaned = content.trim();
    if (!cleaned) {
      showToast('Komentar tidak boleh kosong.', 'warning');
      return;
    }
    const response = await fetch(`/api/hertz/posts/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: cleaned }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      showToast(data?.error?.message ?? 'Komentar gagal diedit.', 'error');
      return;
    }
    afterMutation('Komentar diperbarui.');
  }

  return (
    <div className={styles.wrap}>
      <section id="comments" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>
            <CommentIcon /> Komentar
          </h2>
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
              <button type="submit" disabled={pending === 'comment'}>
                {composerState.submitLabel}
              </button>
            </div>
          </form>
        )}
        <CommentList
          comments={post.comments}
          currentUser={currentUser}
          replyTargetId={replyTargetId}
          replyDraft={replyDraft}
          pending={pending}
          onToggleReply={(commentId) => {
            setReplyTargetId((value) => (value === commentId ? null : commentId));
            setReplyDraft('');
          }}
          onReplyDraftChange={setReplyDraft}
          onSubmitReply={submitReply}
          onDeleteComment={deleteComment}
          onEditComment={editComment}
        />
      </section>
    </div>
  );
}
