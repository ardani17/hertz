import { ActivityLogService } from './activityLog';
import { FeedForbiddenError, FeedNotFoundError } from './feedService';
import { FeedRepository } from '../repositories/feedRepository';
import { PostReactionRepository } from '../repositories/postReactionRepository';
import type { MemberSessionUser } from '../types/membership';

export class PostReactionService {
  private readonly repo = new PostReactionRepository();
  private readonly feedRepo = new FeedRepository();
  private readonly logs = new ActivityLogService();

  async togglePulse(postId: string, user: MemberSessionUser | null): Promise<{ active: boolean }> {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const resolvedPostId = await this.feedRepo.resolvePostId(postId);
    if (!resolvedPostId) throw new FeedNotFoundError('Post tidak ditemukan');
    const result = await this.repo.togglePulse(resolvedPostId, user.id);
    await this.logs.log({
      actor_id: user.id,
      actor_type: user.role === 'admin' ? 'admin' : 'member',
      action: 'hertz.pulse.toggled',
      target_type: 'post',
      target_id: resolvedPostId,
      details: { active: result.active },
    });
    return result;
  }
}
