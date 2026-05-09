import { ActivityLogService } from './activityLog';
import { FeedForbiddenError, FeedNotFoundError } from './feedService';
import { FeedRepository } from '../repositories/feedRepository';
import { PostBookmarkRepository } from '../repositories/postBookmarkRepository';
import type { MemberSessionUser } from '../types/membership';

export class PostBookmarkService {
  private readonly repo = new PostBookmarkRepository();
  private readonly feedRepo = new FeedRepository();
  private readonly logs = new ActivityLogService();

  async toggleBookmark(postId: string, user: MemberSessionUser | null): Promise<{ active: boolean }> {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const resolvedPostId = await this.feedRepo.resolvePostId(postId);
    if (!resolvedPostId) throw new FeedNotFoundError('Post tidak ditemukan');
    const result = await this.repo.toggleBookmark(resolvedPostId, user.id);
    await this.logs.log({
      actor_id: user.id,
      actor_type: user.role === 'admin' ? 'admin' : 'member',
      action: 'hertz.bookmark.toggled',
      target_type: 'post',
      target_id: resolvedPostId,
      details: { active: result.active },
    });
    return result;
  }
}
