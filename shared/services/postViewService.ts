import { PostViewRepository } from '../repositories/postViewRepository';
import { hashForView } from './feedService';

export class PostViewService {
  private readonly repo = new PostViewRepository();

  async recordView(params: {
    postId: string;
    userId?: string | null;
    sessionToken?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ recorded: boolean }> {
    return this.repo.recordView({
      postId: params.postId,
      userId: params.userId ?? null,
      sessionHash: hashForView(params.sessionToken),
      ipHash: hashForView(params.ip),
      userAgentHash: hashForView(params.userAgent),
      dedupeHours: 6,
    });
  }
}
