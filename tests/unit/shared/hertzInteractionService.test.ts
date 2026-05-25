import { describe, expect, it, vi } from 'vitest';
import { HertzRepostService } from '../../../shared/services/hertzInteractionService';
import { HertzForbiddenError } from '../../../shared/services/hertzPostService';
import type { HertzPostRow } from '../../../shared/repositories/hertzPostRepository';
import type { MemberSessionUser } from '../../../shared/types/membership';

const member: MemberSessionUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  telegramId: 5963323428,
  username: 'member',
  displayName: 'Member',
  avatarUrl: null,
  role: 'member',
  badge: 'verified_member',
  verifiedMemberAt: '2026-05-16T00:00:00.000Z',
};

function makePost(overrides: Partial<HertzPostRow> = {}): HertzPostRow {
  return {
    id: '770e8400-e29b-41d4-a716-446655440002',
    short_id: 'hz_original1',
    article_id: null,
    author_id: '660e8400-e29b-41d4-a716-446655440001',
    post_type: 'original',
    source: 'web',
    category: 'trading_room',
    status: 'published',
    visibility: 'public',
    quoted_post_id: null,
    telegram_message_id: null,
    telegram_chat_id: null,
    pinned_at: null,
    edited_at: null,
    deleted_at: null,
    created_at: new Date('2026-05-16T00:00:00.000Z'),
    updated_at: new Date('2026-05-16T00:00:00.000Z'),
    content_html: 'Original setup',
    title: null,
    slug: null,
    author_username: 'owner',
    author_display_name: 'Owner',
    author_avatar_url: null,
    author_role: 'member',
    author_verified_member_at: new Date('2026-05-16T00:00:00.000Z'),
    comment_count: '0',
    pulse_count: '0',
    repost_count: '0',
    view_count: '0',
    viewer_has_pulsed: false,
    viewer_has_bookmarked: false,
    viewer_has_reposted: false,
    pair: null,
    timeframe: null,
    risk_percent: null,
    direction: null,
    entry_price: null,
    entry_zone: null,
    stop_loss: null,
    take_profit: null,
    setup_type: null,
    confidence_percent: null,
    broker_or_source: null,
    ...overrides,
  };
}

function serviceWithRepos({
  original = makePost(),
  toggleResult,
}: {
  original?: HertzPostRow;
  toggleResult: { active: boolean; repostId: string | null; repostPostId: string | null };
}) {
  const service = new HertzRepostService();
  const posts = {
    findById: vi.fn().mockResolvedValue(original),
    updateStatus: vi.fn().mockResolvedValue(undefined),
  };
  const reposts = {
    togglePlainRepost: vi.fn().mockResolvedValue(toggleResult),
    setPlainRepostPostId: vi.fn().mockResolvedValue(undefined),
  };
  const postStats = {
    incr: vi.fn().mockResolvedValue(undefined),
  };
  const hertz = {
    createPlainRepostPost: vi.fn().mockResolvedValue('repost-post-1'),
  };
  (service as unknown as { posts: typeof posts; reposts: typeof reposts; hertz: typeof hertz }).posts = posts;
  (service as unknown as { posts: typeof posts; reposts: typeof reposts; hertz: typeof hertz }).reposts = reposts;
  (service as unknown as { postStats: typeof postStats }).postStats = postStats;
  (service as unknown as { posts: typeof posts; reposts: typeof reposts; hertz: typeof hertz }).hertz = hertz;
  return { service, posts, reposts, postStats, hertz };
}

describe('HertzRepostService plain reposts', () => {
  it('creates a timeline repost post when a plain repost is activated', async () => {
    const { service, reposts, hertz } = serviceWithRepos({
      toggleResult: { active: true, repostId: 'repost-row-1', repostPostId: null },
    });

    await service.repost('hz_original1', member, { type: 'repost' });

    expect(hertz.createPlainRepostPost).toHaveBeenCalledWith(member, expect.objectContaining({ id: '770e8400-e29b-41d4-a716-446655440002' }));
    expect(reposts.setPlainRepostPostId).toHaveBeenCalledWith('repost-row-1', 'repost-post-1');
  });

  it('hides the generated timeline repost post when repost is toggled off', async () => {
    const { service, posts } = serviceWithRepos({
      toggleResult: { active: false, repostId: 'repost-row-1', repostPostId: 'repost-post-1' },
    });

    await service.repost('hz_original1', member, { type: 'repost' });

    expect(posts.updateStatus).toHaveBeenCalledWith('repost-post-1', 'deleted');
  });

  it('rejects reposting your own post', async () => {
    const { service, reposts } = serviceWithRepos({
      original: makePost({ author_id: member.id }),
      toggleResult: { active: true, repostId: 'repost-row-1', repostPostId: null },
    });

    await expect(service.repost('hz_original1', member, { type: 'repost' })).rejects.toThrow(HertzForbiddenError);
    expect(reposts.togglePlainRepost).not.toHaveBeenCalled();
  });
});
