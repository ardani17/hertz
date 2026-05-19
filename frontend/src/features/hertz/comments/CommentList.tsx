'use client';

import { useState } from 'react';
import type { HertzComment, MemberSessionUser } from '@shared/types';
import { HertzAvatar } from '@/components/feed/HertzAvatar';
import styles from '@/components/feed/HertzDetailInteractions.module.css';

type CommentListProps = {
  comments: HertzComment[];
  currentUser: MemberSessionUser | null;
  replyTargetId: string | null;
  replyDraft: string;
  pending: string | null;
  onToggleReply: (commentId: string) => void;
  onReplyDraftChange: (value: string) => void;
  onSubmitReply: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, content: string) => void;
};

export function CommentList({
  comments,
  currentUser,
  replyTargetId,
  replyDraft,
  pending,
  onToggleReply,
  onReplyDraftChange,
  onSubmitReply,
  onDeleteComment,
  onEditComment,
}: CommentListProps) {
  if (comments.length === 0) {
    return <p className={styles.empty}>Belum ada komentar.</p>;
  }

  return (
    <div className={styles.list}>
      {comments.map((item) => (
        <CommentItem
          key={item.id}
          comment={item}
          currentUser={currentUser}
          replyDraft={replyTargetId === item.id ? replyDraft : ''}
          replyOpen={replyTargetId === item.id}
          replyPending={pending === `reply-${item.id}`}
          onToggleReply={() => onToggleReply(item.id)}
          onReplyDraftChange={onReplyDraftChange}
          onSubmitReply={() => onSubmitReply(item.id)}
          onDeleteComment={onDeleteComment}
          onEditComment={onEditComment}
        />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  currentUser,
  replyDraft,
  replyOpen,
  replyPending,
  onToggleReply,
  onReplyDraftChange,
  onSubmitReply,
  onDeleteComment,
  onEditComment,
}: {
  comment: HertzComment;
  currentUser: MemberSessionUser | null;
  replyDraft: string;
  replyOpen: boolean;
  replyPending: boolean;
  onToggleReply: () => void;
  onReplyDraftChange: (value: string) => void;
  onSubmitReply: () => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, content: string) => void;
}) {
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
          <span>
            {new Date(comment.createdAt).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
          {comment.editedAt ? <span>Diedit</span> : null}
        </div>
        {editing ? (
          <form
            className={styles.inlineEdit}
            onSubmit={(event) => {
              event.preventDefault();
              onEditComment(comment.id, draft);
            }}
          >
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={2000} />
            <div>
              <button
                type="button"
                onClick={() => {
                  setDraft(comment.content);
                  setEditing(false);
                }}
              >
                Batal
              </button>
              <button type="submit">Simpan</button>
            </div>
          </form>
        ) : (
          <p>{comment.content}</p>
        )}
        <div className={styles.inlineActions}>
          {currentUser ? (
            <button type="button" className={styles.textButton} onClick={onToggleReply}>
              Balas
            </button>
          ) : null}
          {comment.canEdit ? (
            <button type="button" className={styles.textButton} onClick={() => setEditing((value) => !value)}>
              Edit
            </button>
          ) : null}
          {comment.canDelete ? (
            <button type="button" className={styles.textButton} onClick={() => onDeleteComment(comment.id)}>
              Hapus
            </button>
          ) : null}
        </div>
        {replyOpen ? (
          <form
            className={styles.replyForm}
            onSubmit={(event) => {
              event.preventDefault();
              onSubmitReply();
            }}
          >
            <textarea
              value={replyDraft}
              onChange={(event) => onReplyDraftChange(event.target.value)}
              rows={2}
              maxLength={2000}
              placeholder={`Balas ${comment.author.name}`}
            />
            <div>
              <span>{replyDraft.trim().length}/2000</span>
              <button type="submit" disabled={replyPending}>
                {replyPending ? 'Mengirim...' : 'Kirim balasan'}
              </button>
            </div>
          </form>
        ) : null}
        {comment.replies.length > 0 ? (
          <div className={styles.replies}>
            {comment.replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                comment={reply}
                onDeleteComment={onDeleteComment}
                onEditComment={onEditComment}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ReplyItem({
  comment,
  onDeleteComment,
  onEditComment,
}: {
  comment: HertzComment;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  return (
    <article className={styles.replyItem}>
      <HertzAvatar
        className={styles.avatar}
        src={comment.author.avatarUrl}
        name={comment.author.name}
        username={comment.author.username}
      />
      <div>
        <div className={styles.itemTop}>
          <strong>{comment.author.name}</strong>
          <span>
            {new Date(comment.createdAt).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
          {comment.editedAt ? <span>Diedit</span> : null}
        </div>
        {editing ? (
          <form
            className={styles.inlineEdit}
            onSubmit={(event) => {
              event.preventDefault();
              onEditComment(comment.id, draft);
            }}
          >
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={2000} />
            <div>
              <button
                type="button"
                onClick={() => {
                  setDraft(comment.content);
                  setEditing(false);
                }}
              >
                Batal
              </button>
              <button type="submit">Simpan</button>
            </div>
          </form>
        ) : (
          <p>{comment.content}</p>
        )}
        <div className={styles.inlineActions}>
          {comment.canEdit ? (
            <button type="button" className={styles.textButton} onClick={() => setEditing((value) => !value)}>
              Edit
            </button>
          ) : null}
          {comment.canDelete ? (
            <button type="button" className={styles.textButton} onClick={() => onDeleteComment(comment.id)}>
              Hapus
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
