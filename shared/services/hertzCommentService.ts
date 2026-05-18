import { withTransaction } from '../db';
import { HertzCommentRepository, type HertzCommentRow } from '../repositories/hertzCommentRepository';
import { HertzPostRepository } from '../repositories/hertzPostRepository';
import { ActivityLogService } from './activityLog';
import { HertzForbiddenError, HertzNotFoundError, HertzValidationError } from './hertzPostService';
import { PushNotificationService } from './pushNotificationService';
import { HertzInAppNotificationService } from './hertzInAppNotificationService';
import type { MemberSessionUser } from '../types/membership';

const COMMENT_MAX = 2000;

function cleanComment(content: unknown): string {
  const text = typeof content === 'string' ? content.trim() : '';
  if (!text) throw new HertzValidationError('Komentar tidak boleh kosong');
  if (text.length > COMMENT_MAX) throw new HertzValidationError('Komentar maksimal 2000 karakter');
  return text;
}

export class HertzCommentService {
  private readonly comments = new HertzCommentRepository();
  private readonly posts = new HertzPostRepository();
  private readonly logs = new ActivityLogService();
  private readonly push = new PushNotificationService();
  private readonly inAppNotifications = new HertzInAppNotificationService();

  async create(postId: string, user: MemberSessionUser | null, content: unknown, parentCommentId: unknown = null): Promise<HertzCommentRow> {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    const resolvedPostId = await this.posts.resolvePostId(postId);
    if (!resolvedPostId) throw new HertzNotFoundError('Post tidak ditemukan');
    const resolvedParentCommentId = await this.resolveParentCommentId(resolvedPostId, parentCommentId);
    const comment = await withTransaction(async (client) => {
      const comment = await this.comments.create(resolvedPostId, user.id, cleanComment(content), resolvedParentCommentId, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.comment.created',
        target_type: 'comment',
        target_id: comment.id,
        details: { post_id: resolvedPostId },
      }, client);
      return comment;
    });
    void this.push.notifyHertzCommentCreated({ postId: resolvedPostId, commentId: comment.id, commenterId: user.id });
    void this.inAppNotifications.notifyComment({ postId: resolvedPostId, commentId: comment.id, actorUserId: user.id }).catch(() => undefined);
    return comment;
  }


  private async resolveParentCommentId(postId: string, value: unknown): Promise<string | null> {
    if (value == null || value === '') return null;
    if (typeof value !== 'string') throw new HertzValidationError('Komentar induk tidak valid');
    const parent = await this.comments.findById(value);
    if (!parent || parent.post_id !== postId || parent.status !== 'visible' || parent.deleted_at) {
      throw new HertzValidationError('Komentar induk tidak valid');
    }
    return parent.parent_comment_id ?? parent.id;
  }

  async edit(commentId: string, user: MemberSessionUser | null, content: unknown): Promise<void> {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    const comment = await this.comments.findById(commentId);
    if (!comment) throw new HertzNotFoundError('Komentar tidak ditemukan');
    if (comment.user_id !== user.id && user.role !== 'admin') throw new HertzForbiddenError();
    await this.comments.updateContent(commentId, cleanComment(content));
  }

  async delete(commentId: string, user: MemberSessionUser | null): Promise<void> {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    const comment = await this.comments.findById(commentId);
    if (!comment) throw new HertzNotFoundError('Komentar tidak ditemukan');
    if (comment.user_id !== user.id && user.role !== 'admin') throw new HertzForbiddenError();
    await this.comments.softDelete(commentId);
  }

  async hide(commentId: string, admin: MemberSessionUser): Promise<void> {
    if (admin.role !== 'admin') throw new HertzForbiddenError();
    await this.comments.hide(commentId);
  }
}
