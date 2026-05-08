import { withTransaction } from '../db';
import { ActivityLogService } from './activityLog';
import { FeedForbiddenError, FeedNotFoundError, FeedValidationError } from './feedService';
import { PostCommentRepository } from '../repositories/postCommentRepository';
import type { MemberSessionUser } from '../types/membership';

const COMMENT_MAX = 2000;

function cleanComment(content: unknown): string {
  const text = typeof content === 'string' ? content.trim() : '';
  if (!text) throw new FeedValidationError('Komentar tidak boleh kosong');
  if (text.length > COMMENT_MAX) throw new FeedValidationError('Komentar maksimal 2000 karakter');
  return text;
}

export class PostCommentService {
  private readonly repo = new PostCommentRepository();
  private readonly logs = new ActivityLogService();

  async create(postId: string, user: MemberSessionUser | null, content: unknown) {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const cleaned = cleanComment(content);
    const row = await withTransaction(async (client) => {
      const comment = await this.repo.create(postId, user.id, cleaned, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'signal_ledger.comment.created',
        target_type: 'comment',
        target_id: comment.id,
        details: { post_id: postId },
      }, client);
      return comment;
    });
    return row;
  }

  async edit(commentId: string, user: MemberSessionUser | null, content: unknown): Promise<void> {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const comment = await this.repo.findById(commentId);
    if (!comment) throw new FeedNotFoundError('Komentar tidak ditemukan');
    if (comment.user_id !== user.id && user.role !== 'admin') throw new FeedForbiddenError();
    const cleaned = cleanComment(content);
    await withTransaction(async (client) => {
      await this.repo.updateContent(commentId, cleaned, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'signal_ledger.comment.edited',
        target_type: 'comment',
        target_id: commentId,
      }, client);
    });
  }

  async delete(commentId: string, user: MemberSessionUser | null): Promise<void> {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const comment = await this.repo.findById(commentId);
    if (!comment) throw new FeedNotFoundError('Komentar tidak ditemukan');
    if (comment.user_id !== user.id && user.role !== 'admin') throw new FeedForbiddenError();
    await withTransaction(async (client) => {
      await this.repo.softDelete(commentId, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'signal_ledger.comment.deleted',
        target_type: 'comment',
        target_id: commentId,
      }, client);
    });
  }

  async hide(commentId: string, admin: MemberSessionUser): Promise<void> {
    if (admin.role !== 'admin') throw new FeedForbiddenError();
    await withTransaction(async (client) => {
      await this.repo.hide(commentId, client);
      await this.logs.log({
        actor_id: admin.id,
        actor_type: 'admin',
        action: 'signal_ledger.comment.hidden',
        target_type: 'comment',
        target_id: commentId,
      }, client);
    });
  }
}
