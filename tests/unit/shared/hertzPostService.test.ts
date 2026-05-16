import { describe, expect, it, vi } from 'vitest';
import {
  HertzForbiddenError,
  HertzPostService,
} from '../../../shared/services/hertzPostService';
import type { HertzPostRow } from '../../../shared/repositories/hertzPostRepository';
import type { MemberSessionUser } from '../../../shared/types/membership';

const owner: MemberSessionUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  telegramId: 5963323428,
  username: 'owner',
  displayName: 'Owner Member',
  avatarUrl: null,
  role: 'member',
  badge: 'verified_member',
  verifiedMemberAt: '2026-05-08T00:00:00.000Z',
};

const otherMember: MemberSessionUser = {
  ...owner,
  id: '660e8400-e29b-41d4-a716-446655440001',
  telegramId: 5963323429,
  username: 'other',
  displayName: 'Other Member',
};

function makePost(overrides: Partial<HertzPostRow> = {}): HertzPostRow {
  return {
    id: '770e8400-e29b-41d4-a716-446655440002',
    short_id: 'hz_owner1',
    article_id: null,
    author_id: owner.id,
    post_type: 'original',
    source: 'telegram',
    category: 'general',
    status: 'published',
    visibility: 'public',
    quoted_post_id: null,
    telegram_message_id: 123,
    telegram_chat_id: -100123,
    pinned_at: null,
    edited_at: null,
    deleted_at: null,
    created_at: new Date('2026-05-15T01:00:00.000Z'),
    updated_at: new Date('2026-05-15T01:00:00.000Z'),
    content_html: 'Post lama dari Telegram',
    title: null,
    slug: null,
    author_username: owner.username,
    author_display_name: owner.displayName,
    author_avatar_url: null,
    author_role: 'member',
    author_verified_member_at: new Date('2026-05-08T00:00:00.000Z'),
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

function serviceWithPosts(posts: {
  findById: ReturnType<typeof vi.fn>;
  updateContent?: ReturnType<typeof vi.fn>;
  updateStatus?: ReturnType<typeof vi.fn>;
}) {
  const service = new HertzPostService();
  (service as unknown as { posts: typeof posts }).posts = posts;
  return service;
}

describe('HertzPostService owner post permissions', () => {
  it('allows the Telegram post owner to edit their own published post after the old edit window', async () => {
    const updateContent = vi.fn().mockResolvedValue(undefined);
    const service = serviceWithPosts({
      findById: vi.fn().mockResolvedValue(makePost({
        created_at: new Date('2026-05-14T01:00:00.000Z'),
      })),
      updateContent,
    });

    await service.editPost('hz_owner1', owner, 'Konten sudah diedit');

    expect(updateContent).toHaveBeenCalledWith(
      '770e8400-e29b-41d4-a716-446655440002',
      'Konten sudah diedit',
    );
  });

  it('rejects edits from a member who does not own the post', async () => {
    const updateContent = vi.fn().mockResolvedValue(undefined);
    const service = serviceWithPosts({
      findById: vi.fn().mockResolvedValue(makePost()),
      updateContent,
    });

    await expect(service.editPost('hz_owner1', otherMember, 'Tidak boleh')).rejects.toThrow(HertzForbiddenError);
    expect(updateContent).not.toHaveBeenCalled();
  });

  it('allows the Telegram post owner to delete their own post', async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined);
    const service = serviceWithPosts({
      findById: vi.fn().mockResolvedValue(makePost()),
      updateStatus,
    });

    await service.deletePost('hz_owner1', owner);

    expect(updateStatus).toHaveBeenCalledWith(
      '770e8400-e29b-41d4-a716-446655440002',
      'deleted',
    );
  });
});
