'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { MemberSessionUser, HertzPostDetail, HertzComment } from '@shared/types';
import { CommentList } from '@/features/hertz/comments/CommentList';
import { useToast } from '@/components/ui/Toast';
import { refreshPreserveScroll } from '@/lib/hertzRefresh';
import { mergeOptimisticList } from '@/lib/swr/optimistic';
import { useCommentList, type CommentListData } from '@/lib/swr/hooks/useComments';
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

function buildOptimisticComment(params: {
  id: string;
  postId: string;
  user: MemberSessionUser;
  content: string;
  parentCommentId?: string | null;
}): HertzComment {
  return {
    id: params.id,
    postId: params.postId,
    userId: params.user.id,
    parentCommentId: params.parentCommentId ?? null,
    replies: [],
    author: {
      id: params.user.id,
      name: params.user.displayName ?? params.user.username ?? 'Member',
      username: params.user.username,
      badge: params.user.role === 'admin' ? 'admin' : 'verified_member',
      avatarUrl: params.user.avatarUrl ?? null,
    },
    content: params.content,
    status: 'visible',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    editedAt: null,
    canEdit: true,
    canDelete: true,
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
  const { data, isLoading, mutate } = useCommentList(post.shortId);
  const comments = data?.comments ?? post.comments;
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

  async function mutateComments(
    updater: (current: CommentListData | undefined) => CommentListData,
    revalidate = true,
  ) {
    await mutate(updater, { revalidate });
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireLogin() || !currentUser) return;
    const content = comment.trim();
    if (!content) {
      showToast('Komentar tidak boleh kosong.', 'warning');
      return;
    }
    const optimisticId = crypto.randomUUID();
    const snapshot = data ?? { comments };
    try {
      setPending('comment');
      const optimistic = buildOptimisticComment({
        id: optimisticId,
        postId: post.id,
        user: currentUser,
        content,
      });
      await mutateComments(
        (current) => ({
          comments: mergeOptimisticList(current?.comments ?? comments, optimistic, { optimisticId }),
        }),
        false,
      );
      const response = await fetch(`/api/hertz/posts/${post.shortId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, client_id: optimisticId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        await mutate(snapshot, { revalidate: false });
        showToast(payload?.error?.message ?? 'Komentar gagal dikirim.', 'error');
        return;
      }
      setComment('');
      showToast('Komentar terkirim.', 'success');
      await mutate();
    } catch {
      await mutate(snapshot, { revalidate: false });
      showToast('Komentar gagal dikirim.', 'error');
    } finally {
      setPending(null);
    }
  }

  async function submitReply(parentCommentId: string) {
    if (!requireLogin() || !currentUser) return;
    const content = replyDraft.trim();
    if (!content) {
      showToast('Balasan tidak boleh kosong.', 'warning');
      return;
    }
    const optimisticId = crypto.randomUUID();
    const snapshot = data ?? { comments };
    try {
      setPending(`reply-${parentCommentId}`);
      const optimistic = buildOptimisticComment({
        id: optimisticId,
        postId: post.id,
        user: currentUser,
        content,
        parentCommentId,
      });
      await mutateComments(
        (current) => ({
          comments: mergeOptimisticList(current?.comments ?? comments, optimistic, { optimisticId }),
        }),
        false,
      );
      const response = await fetch(`/api/hertz/posts/${post.shortId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentCommentId, client_id: optimisticId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        await mutate(snapshot, { revalidate: false });
        showToast(payload?.error?.message ?? 'Balasan gagal dikirim.', 'error');
        return;
      }
      setReplyDraft('');
      setReplyTargetId(null);
      showToast('Balasan terkirim.', 'success');
      await mutate();
    } catch {
      await mutate(snapshot, { revalidate: false });
      showToast('Balasan gagal dikirim.', 'error');
    } finally {
      setPending(null);
    }
  }

  async function deleteComment(commentId: string) {
    if (!requireLogin()) return;
    const response = await fetch(`/api/hertz/posts/comments/${commentId}`, { method: 'DELETE' });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      showToast(payload?.error?.message ?? 'Komentar gagal dihapus.', 'error');
      refreshPreserveScroll(router);
      return;
    }
    showToast('Komentar dihapus.', 'success');
    await mutate();
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
      const payload = await response.json().catch(() => null);
      showToast(payload?.error?.message ?? 'Komentar gagal diedit.', 'error');
      refreshPreserveScroll(router);
      return;
    }
    showToast('Komentar diperbarui.', 'success');
    await mutate();
  }

  return (
    <div className={styles.wrap}>
      <section id="comments" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>
            <CommentIcon /> Komentar
          </h2>
          <span>{comments.length}</span>
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
          comments={comments}
          currentUser={currentUser}
          isLoading={isLoading && !data}
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
