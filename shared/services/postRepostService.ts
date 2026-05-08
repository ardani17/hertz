import { FeedForbiddenError, FeedService } from './feedService';
import type { RepostInput } from '../types/feed';
import type { MemberSessionUser } from '../types/membership';

export class PostRepostService {
  private readonly feed = new FeedService();

  async repost(postId: string, user: MemberSessionUser | null, input: RepostInput) {
    if (!user) {
      throw new FeedForbiddenError('Login member diperlukan');
    }
    return this.feed.createRepost(postId, user, input);
  }
}
