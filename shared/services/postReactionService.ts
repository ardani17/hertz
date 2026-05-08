import { ActivityLogService } from './activityLog';
import { FeedForbiddenError } from './feedService';
import { PostReactionRepository } from '../repositories/postReactionRepository';
import type { MemberSessionUser } from '../types/membership';

export class PostReactionService {
  private readonly repo = new PostReactionRepository();
  private readonly logs = new ActivityLogService();

  async toggleSignal(postId: string, user: MemberSessionUser | null): Promise<{ active: boolean }> {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const result = await this.repo.toggleSignal(postId, user.id);
    await this.logs.log({
      actor_id: user.id,
      actor_type: user.role === 'admin' ? 'admin' : 'member',
      action: 'signal_ledger.signal.toggled',
      target_type: 'post',
      target_id: postId,
      details: { active: result.active },
    });
    return result;
  }
}
