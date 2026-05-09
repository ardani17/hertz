import { PostViewRepository } from '../repositories/postViewRepository';
import { FeedRepository } from '../repositories/feedRepository';
import { hashForView } from './feedService';

export class PostViewService {
  private readonly repo = new PostViewRepository();
  private readonly feedRepo = new FeedRepository();

  async recordView(params: {
    postId: string;
    userId?: string | null;
    sessionToken?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ recorded: boolean }> {
    const postId = await this.feedRepo.resolvePostId(params.postId);
    if (!postId) return { recorded: false };
    return this.repo.recordView({
      postId,
      userId: params.userId ?? null,
      sessionHash: hashForView(params.sessionToken),
      ipHash: hashForView(params.ip),
      userAgentHash: hashForView(params.userAgent),
      dedupeHours: 6,
    });
  }
}
