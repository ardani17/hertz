import { ActivityLogService } from './activityLog';
import { FeedForbiddenError } from './feedService';
import { PostBookmarkRepository } from '../repositories/postBookmarkRepository';
import type { MemberSessionUser } from '../types/membership';

export class PostBookmarkService {
  private readonly repo = new PostBookmarkRepository();
  private readonly logs = new ActivityLogService();

  async toggleBookmark(postId: string, user: MemberSessionUser | null): Promise<{ active: boolean }> {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const result = await this.repo.toggleBookmark(postId, user.id);
    await this.logs.log({
      actor_id: user.id,
      actor_type: user.role === 'admin' ? 'admin' : 'member',
      action: 'signal_ledger.bookmark.toggled',
      target_type: 'post',
      target_id: postId,
      details: { active: result.active },
    });
    return result;
  }
}
