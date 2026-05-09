import { HertzBookmarkRepository, HertzReactionRepository, HertzRepostRepository, HertzViewRepository } from '../repositories/hertzInteractionRepository';
import { HertzPostRepository } from '../repositories/hertzPostRepository';
import { ActivityLogService } from './activityLog';
import { hashForView, HertzForbiddenError, HertzNotFoundError, HertzPostService } from './hertzPostService';
import type { RepostInput } from '../types/feed';
import type { MemberSessionUser } from '../types/membership';

export class HertzReactionService {
  private readonly reactions = new HertzReactionRepository();
  private readonly posts = new HertzPostRepository();
  private readonly logs = new ActivityLogService();

  async togglePulse(postId: string, user: MemberSessionUser | null): Promise<{ active: boolean }> {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    const resolvedPostId = await this.posts.resolvePostId(postId);
    if (!resolvedPostId) throw new HertzNotFoundError('Post tidak ditemukan');
    const result = await this.reactions.togglePulse(resolvedPostId, user.id);
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

export class HertzBookmarkService {
  private readonly bookmarks = new HertzBookmarkRepository();
  private readonly posts = new HertzPostRepository();

  async toggleBookmark(postId: string, user: MemberSessionUser | null): Promise<{ active: boolean }> {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    const resolvedPostId = await this.posts.resolvePostId(postId);
    if (!resolvedPostId) throw new HertzNotFoundError('Post tidak ditemukan');
    return this.bookmarks.toggleBookmark(resolvedPostId, user.id);
  }
}

export class HertzRepostService {
  private readonly posts = new HertzPostRepository();
  private readonly reposts = new HertzRepostRepository();
  private readonly hertz = new HertzPostService();

  async repost(postId: string, user: MemberSessionUser | null, input: RepostInput) {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    const original = await this.posts.findById(postId, user.id);
    if (!original || original.status !== 'published' || original.deleted_at) throw new HertzNotFoundError('Post tidak ditemukan');
    if (input.type === 'repost') {
      if (original.author_id === user.id) throw new HertzForbiddenError('Tidak bisa repost post sendiri');
      return this.reposts.togglePlainRepost(original.id, user.id);
    }
    const quote = await this.hertz.createQuotePost(user, original.id, {
      category: original.category,
      content: input.content,
      mediaIds: input.mediaIds,
    });
    await this.reposts.createQuote(original.id, user.id, quote.id);
    return { post: quote };
  }
}

export class HertzViewService {
  private readonly views = new HertzViewRepository();
  private readonly posts = new HertzPostRepository();

  async recordView(params: {
    postId: string;
    userId?: string | null;
    sessionToken?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ recorded: boolean }> {
    const postId = await this.posts.resolvePostId(params.postId);
    if (!postId) return { recorded: false };
    return this.views.recordView({
      postId,
      userId: params.userId ?? null,
      sessionHash: hashForView(params.sessionToken),
      ipHash: hashForView(params.ip),
      userAgentHash: hashForView(params.userAgent),
      dedupeHours: 6,
    });
  }
}
