import { describe, expect, it, vi } from 'vitest';
import {
  HertzForbiddenError,
  HertzPostService,
  HertzValidationError,
} from '../../../shared/services/hertzPostService';
import type { HertzPostRow } from '../../../shared/repositories/hertzPostRepository';
import type { MemberSessionUser } from '../../../shared/types/membership';

vi.mock('../../../shared/db', async () => {
  const actual = await vi.importActual<typeof import('../../../shared/db')>('../../../shared/db');
  return {
    ...actual,
    withTransaction: vi.fn(async (fn: (client: unknown) => Promise<unknown>) => fn({})),
    query: vi.fn().mockResolvedValue({ rows: [] }),
    execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
  };
});

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

const admin: MemberSessionUser = {
  ...owner,
  id: '880e8400-e29b-41d4-a716-446655440003',
  telegramId: 5963323430,
  username: 'admin',
  displayName: 'Admin App',
  role: 'admin',
  badge: 'admin',
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
  shortIdExists?: ReturnType<typeof vi.fn>;
  createPost?: ReturnType<typeof vi.fn>;
  attachMedia?: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  updateContent?: ReturnType<typeof vi.fn>;
  updateStatus?: ReturnType<typeof vi.fn>;
  upsertMarketContext?: ReturnType<typeof vi.fn>;
}) {
  const service = new HertzPostService();
  (service as unknown as { posts: typeof posts }).posts = posts;
  return service;
}

function webPostServiceWithPosts(posts: {
  shortIdExists?: ReturnType<typeof vi.fn>;
  createPost?: ReturnType<typeof vi.fn>;
  attachMedia?: ReturnType<typeof vi.fn>;
  upsertMarketContext?: ReturnType<typeof vi.fn>;
}) {
  const getPostDetail = vi.spyOn(HertzPostService.prototype, 'getPostDetail').mockResolvedValue({
    id: '770e8400-e29b-41d4-a716-446655440002',
    shortId: 'hz_owner1',
    type: 'original',
    source: 'web',
    category: 'trading_room',
    status: 'published',
    content: { html: '', text: '', isTruncated: false },
    author: { id: owner.id, name: owner.displayName, username: owner.username, badge: 'verified_member', avatarUrl: null },
    media: [],
    market: { pair: 'XAUUSD' },
    counts: { comments: 0, pulse: 0, reposts: 0, views: 0 },
    viewer: { hasPulsed: false, hasBookmarked: false, hasReposted: false, canEdit: true, canDelete: true },
    createdAt: '2026-05-15T01:00:00.000Z',
    updatedAt: '2026-05-15T01:00:00.000Z',
    editedAt: null,
  } as Awaited<ReturnType<HertzPostService['getPostDetail']>>);
  const service = new HertzPostService();
  (service as unknown as {
    posts: {
      shortIdExists: ReturnType<typeof vi.fn>;
      createPost: ReturnType<typeof vi.fn>;
      attachMedia: ReturnType<typeof vi.fn>;
      upsertMarketContext: ReturnType<typeof vi.fn>;
    };
    logs: { log: ReturnType<typeof vi.fn> };
  }).posts = {
    shortIdExists: posts.shortIdExists ?? vi.fn().mockResolvedValue(false),
    createPost: posts.createPost ?? vi.fn().mockResolvedValue({ id: '770e8400-e29b-41d4-a716-446655440002', short_id: 'hz_owner1' }),
    attachMedia: posts.attachMedia ?? vi.fn().mockResolvedValue(undefined),
    upsertMarketContext: posts.upsertMarketContext ?? vi.fn().mockResolvedValue(undefined),
  };
  (service as unknown as { logs: { log: ReturnType<typeof vi.fn> } }).logs = {
    log: vi.fn().mockResolvedValue(undefined),
  };
  return { service, getPostDetail };
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

  it('allows a trading post owner to edit their own market metadata', async () => {
    const upsertMarketContext = vi.fn().mockResolvedValue(undefined);
    const service = serviceWithPosts({
      findById: vi.fn().mockResolvedValue(makePost({ category: 'trading_room' })),
      upsertMarketContext,
    });

    await service.updateMarketContext('hz_owner1', owner, { pair: 'XAUUSD', riskPercent: 2 });

    expect(upsertMarketContext).toHaveBeenCalledWith(
      '770e8400-e29b-41d4-a716-446655440002',
      { pair: 'XAUUSD', riskPercent: 2 },
    );
  });

  it('allows admin to edit market metadata on any post', async () => {
    const upsertMarketContext = vi.fn().mockResolvedValue(undefined);
    const service = serviceWithPosts({
      findById: vi.fn().mockResolvedValue(makePost({ author_id: owner.id })),
      upsertMarketContext,
    });

    await service.updateMarketContext('hz_owner1', admin, { pair: 'BTC/USDT' });

    expect(upsertMarketContext).toHaveBeenCalledWith(
      '770e8400-e29b-41d4-a716-446655440002',
      { pair: 'BTC/USDT' },
    );
  });

  it('rejects market metadata edits from a non-author member', async () => {
    const upsertMarketContext = vi.fn().mockResolvedValue(undefined);
    const service = serviceWithPosts({
      findById: vi.fn().mockResolvedValue(makePost()),
      upsertMarketContext,
    });

    await expect(service.updateMarketContext('hz_owner1', otherMember, { pair: 'XAUUSD' })).rejects.toThrow(HertzForbiddenError);
    expect(upsertMarketContext).not.toHaveBeenCalled();
  });
});

describe('HertzPostService web post validation', () => {
  it('allows trading posts with pair and media without content', async () => {
    const createPost = vi.fn().mockResolvedValue({ id: '770e8400-e29b-41d4-a716-446655440002', short_id: 'hz_owner1' });
    const attachMedia = vi.fn().mockResolvedValue(undefined);
    const upsertMarketContext = vi.fn().mockResolvedValue(undefined);
    const { service, getPostDetail } = webPostServiceWithPosts({ createPost, attachMedia, upsertMarketContext });

    await service.createWebPost(owner, {
      category: 'trading_room',
      content: '',
      mediaIds: ['550e8400-e29b-41d4-a716-446655440010'],
      market: { pair: 'XAUUSD' },
    });

    expect(createPost).toHaveBeenCalledWith(expect.objectContaining({ content: '' }), expect.anything());
    expect(attachMedia).toHaveBeenCalledWith(
      '770e8400-e29b-41d4-a716-446655440002',
      ['550e8400-e29b-41d4-a716-446655440010'],
      expect.anything(),
    );
    expect(upsertMarketContext).toHaveBeenCalledWith(
      '770e8400-e29b-41d4-a716-446655440002',
      { pair: 'XAUUSD' },
      expect.anything(),
    );
    getPostDetail.mockRestore();
  });

  it('requires media for trading posts before touching storage', async () => {
    const createPost = vi.fn();
    const { service, getPostDetail } = webPostServiceWithPosts({ createPost });

    await expect(service.createWebPost(owner, {
      category: 'trading_room',
      content: '',
      mediaIds: [],
      market: { pair: 'XAUUSD' },
    })).rejects.toThrow('Lampiran wajib untuk Trading Room');
    expect(createPost).not.toHaveBeenCalled();
    getPostDetail.mockRestore();
  });

  it('requires pair for trading posts before touching storage', async () => {
    const createPost = vi.fn();
    const { service, getPostDetail } = webPostServiceWithPosts({ createPost });

    await expect(service.createWebPost(owner, {
      category: 'trading_room',
      content: '',
      mediaIds: ['550e8400-e29b-41d4-a716-446655440010'],
      market: { pair: '' },
    })).rejects.toThrow('Pair wajib diisi untuk Trading Room');
    expect(createPost).not.toHaveBeenCalled();
    getPostDetail.mockRestore();
  });

  it('still requires content for non-trading posts', async () => {
    const createPost = vi.fn();
    const { service, getPostDetail } = webPostServiceWithPosts({ createPost });

    await expect(service.createWebPost(owner, {
      category: 'general',
      content: '',
      mediaIds: ['550e8400-e29b-41d4-a716-446655440010'],
    })).rejects.toThrow(HertzValidationError);
    expect(createPost).not.toHaveBeenCalled();
    getPostDetail.mockRestore();
  });
});

describe('HertzPostService listAuthorFeed', () => {
  it('filters published posts by author id', async () => {
    const listPublished = vi.fn().mockResolvedValue([]);
    const listMedia = vi.fn().mockResolvedValue([]);
    const service = new HertzPostService();
    (service as unknown as { posts: { listPublished: typeof listPublished; listMedia: typeof listMedia } }).posts = {
      listPublished,
      listMedia,
    };

    const result = await service.listAuthorFeed({ authorId: owner.id, viewer: null, limit: 20 });

    expect(listPublished).toHaveBeenCalledWith(expect.objectContaining({
      authorId: owner.id,
      sort: 'latest',
      limit: 21,
    }));
    expect(result).toEqual({ items: [], nextCursor: null });
  });
});
