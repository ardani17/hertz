import { createHash, randomBytes } from 'crypto';
import { execute, query, queryOne, withTransaction, type DbClient } from '../db';
import { HertzCommentRepository, type HertzCommentRow } from '../repositories/hertzCommentRepository';
import { HertzPostRepository, type HertzPostRow } from '../repositories/hertzPostRepository';
import { ActivityLogService } from './activityLog';
import { PushNotificationService } from './pushNotificationService';
import { textToHtml, stripHtml } from '../utils/textToHtml';
import { resolveMentionedUserIds } from '../utils/mentionParser';
import type { MemberSessionUser } from '../types/membership';
import type {
  CursorFeedResult,
  MarketContext,
  HertzAuthor,
  HertzComment,
  HertzMedia,
  HertzPost,
  HertzPostCategory,
  HertzPostDetail,
  HertzPostInput,
  HertzPostSource,
  HertzPostStatus,
} from '../types/feed';

const EXCERPT_LIMIT = 420;
const SHORT_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const VALID_CATEGORIES: HertzPostCategory[] = ['trading_room', 'life_coffee', 'general'];
const DEFAULT_SITE_URL = 'https://hertz.cloudnexify.com';

function truncateMetadataText(text: string, maxLength: number) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildHertzPostSocialMetadata(input: {
  shortId: string;
  authorName: string;
  contentText: string;
  imageUrl?: string | null;
  siteUrl?: string | null;
} | null) {
  if (!input) {
    return {
      title: 'HERTZ post',
      description: 'Postingan HERTZ tidak tersedia.',
      alternates: { canonical: `${DEFAULT_SITE_URL}/hertz` },
      openGraph: {
        title: 'HERTZ post',
        description: 'Postingan HERTZ tidak tersedia.',
        url: `${DEFAULT_SITE_URL}/hertz`,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'HERTZ post',
        description: 'Postingan HERTZ tidak tersedia.',
      },
    };
  }

  const siteUrl = (input.siteUrl || DEFAULT_SITE_URL).replace(/\/$/, '');
  const canonical = `${siteUrl}/hertz/post/${input.shortId}`;
  const description = truncateMetadataText(input.contentText || 'Postingan HERTZ', 180);
  const title = truncateMetadataText(`${input.authorName}: ${description}`, 90);
  const images = input.imageUrl ? [{ url: input.imageUrl }] : [{ url: '/images/og-default.svg' }];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export class HertzValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedValidationError';
  }
}

export class HertzForbiddenError extends Error {
  constructor(message = 'Akses ditolak') {
    super(message);
    this.name = 'FeedForbiddenError';
  }
}

export class HertzNotFoundError extends Error {
  constructor(message = 'Post tidak ditemukan') {
    super(message);
    this.name = 'FeedNotFoundError';
  }
}

function assertMember(user: MemberSessionUser | null): asserts user is MemberSessionUser {
  if (!user) throw new HertzForbiddenError('Login member diperlukan');
}

export function normalizeHertzCategory(category: unknown): HertzPostCategory {
  if (category === 'trading') return 'trading_room';
  if (category === 'life_story') return 'life_coffee';
  if (typeof category === 'string' && VALID_CATEGORIES.includes(category as HertzPostCategory)) {
    return category as HertzPostCategory;
  }
  throw new HertzValidationError('Kategori tidak valid');
}

function cleanText(value: unknown, max = 12000): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new HertzValidationError('Konten tidak boleh kosong');
  if (text.length > max) throw new HertzValidationError(`Konten maksimal ${max} karakter`);
  return text;
}

function cleanOptionalText(value: unknown, max = 12000): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > max) throw new HertzValidationError(`Konten maksimal ${max} karakter`);
  return text;
}

function optionalMediaIds(value: unknown): string[] {
  if (!value) return [];
  if (!Array.isArray(value)) throw new HertzValidationError('mediaIds harus array');
  const ids = value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  if (ids.length > 4) throw new HertzValidationError('Maksimal 4 media per post');
  return ids;
}

function validateMarket(category: HertzPostCategory, market: MarketContext | null | undefined): MarketContext | null {
  if (category !== 'trading_room') return null;
  const pair = typeof market?.pair === 'string' ? market.pair.trim() : '';
  if (!pair) throw new HertzValidationError('Pair wajib diisi untuk Trading Room');
  return { ...market, pair };
}

function createShortIdCandidate(): string {
  let suffix = '';
  for (const byte of randomBytes(8)) {
    suffix += SHORT_ID_ALPHABET[byte % SHORT_ID_ALPHABET.length];
  }
  return `hz_${suffix}`;
}

function encodeCursor(row: { created_at: Date; id: string }): string {
  return Buffer.from(JSON.stringify({
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    id: row.id,
  })).toString('base64url');
}

function decodeCursor(cursor: string | null): { createdAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as { createdAt?: string; id?: string };
    return parsed.createdAt && parsed.id ? { createdAt: parsed.createdAt, id: parsed.id } : null;
  } catch {
    return null;
  }
}

function dateToIso(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function numberOrNull(value: string | number | null): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function authorFromRow(row: HertzPostRow): HertzAuthor {
  return {
    id: row.author_id,
    name: row.author_display_name ?? row.author_username ?? 'Member Hertz',
    username: row.author_username,
    badge: row.author_role === 'admin' ? 'admin' : 'verified_member',
    avatarUrl: row.author_avatar_url,
  };
}

export class HertzPostService {
  private readonly posts = new HertzPostRepository();
  private readonly comments = new HertzCommentRepository();
  private readonly logs = new ActivityLogService();
  private readonly push = new PushNotificationService();

  async listFeed(params: {
    cursor?: string | null;
    limit?: number;
    category?: string | null;
    search?: string | null;
    sort?: string | null;
    viewer?: MemberSessionUser | null;
  }): Promise<CursorFeedResult> {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const decoded = decodeCursor(params.cursor ?? null);
    const category = params.category ? normalizeHertzCategory(params.category) : null;
    const sort = params.sort === 'trending' ? 'trending' : 'latest';
    const rows = await this.posts.listPublished({
      limit: limit + 1,
      cursorCreatedAt: decoded?.createdAt ?? null,
      cursorId: decoded?.id ?? null,
      category,
      search: params.search ?? null,
      sort,
      viewerId: params.viewer?.id ?? null,
    });
    const pageRows = rows.slice(0, limit);
    return {
      items: await this.mapPosts(pageRows, params.viewer ?? null),
      nextCursor: rows.length > limit ? encodeCursor(rows[limit]) : null,
    };
  }

  async listAuthorFeed(params: {
    authorId: string;
    cursor?: string | null;
    limit?: number;
    viewer?: MemberSessionUser | null;
  }): Promise<CursorFeedResult> {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const decoded = decodeCursor(params.cursor ?? null);
    const rows = await this.posts.listPublished({
      limit: limit + 1,
      cursorCreatedAt: decoded?.createdAt ?? null,
      cursorId: decoded?.id ?? null,
      authorId: params.authorId,
      sort: 'latest',
      viewerId: params.viewer?.id ?? null,
    });
    const pageRows = rows.slice(0, limit);
    return {
      items: await this.mapPosts(pageRows, params.viewer ?? null),
      nextCursor: rows.length > limit ? encodeCursor(rows[limit]) : null,
    };
  }

  async resolvePublishedAuthorId(username: string): Promise<string | null> {
    const normalized = username.trim().toLowerCase();
    if (!normalized) return null;
    const row = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(username) = $1 AND verified_member_at IS NOT NULL LIMIT 1`,
      [normalized],
    );
    return row?.id ?? null;
  }

  async getPostDetail(postId: string, viewer?: MemberSessionUser | null): Promise<HertzPostDetail> {
    const row = await this.posts.findById(postId, viewer?.id ?? null);
    if (!row || row.status !== 'published' || row.deleted_at) throw new HertzNotFoundError();
    const [post] = await this.mapPosts([row], viewer ?? null, false);
    return {
      ...post,
      comments: await this.listComments(row.id, viewer ?? null),
    };
  }

  async createWebPost(user: MemberSessionUser, input: HertzPostInput): Promise<HertzPost> {
    assertMember(user);
    const category = normalizeHertzCategory(input.category);
    const mediaIds = optionalMediaIds(input.mediaIds);
    if (category === 'trading_room' && mediaIds.length === 0) {
      throw new HertzValidationError('Lampiran wajib untuk Trading Room');
    }
    const content = category === 'trading_room' ? cleanOptionalText(input.content) : cleanText(input.content);
    const market = validateMarket(category, input.market);

    const postId = await withTransaction(async (client) => {
      const post = await this.posts.createPost({
        shortId: await this.generateShortId(),
        authorId: user.id,
        type: 'original',
        source: 'web',
        category,
        status: 'published',
        content,
      }, client);
      await this.posts.attachMedia(post.id, mediaIds, client);
      await this.posts.upsertMarketContext(post.id, market, client);
      await awardHertzCredit(user.id, 'hertz_post_published', post.id, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.post.created',
        target_type: 'post',
        target_id: post.id,
        details: { source: 'web', category },
      }, client);
      return post.id;
    });

    void this.notifyMentions(content, user.id, 'post', postId);
    return this.getPostDetail(postId, user);
  }

  async createQuotePost(user: MemberSessionUser, quotedPostId: string, input: HertzPostInput): Promise<HertzPost> {
    assertMember(user);
    const originalId = await this.posts.resolvePostId(quotedPostId);
    if (!originalId) throw new HertzNotFoundError('Post tidak ditemukan');
    const category = normalizeHertzCategory(input.category);
    const content = cleanText(input.content, 4000);
    const mediaIds = optionalMediaIds(input.mediaIds);
    const postId = await withTransaction(async (client) => {
      const post = await this.posts.createPost({
        shortId: await this.generateShortId(),
        authorId: user.id,
        type: 'quote',
        source: 'web',
        category,
        status: 'published',
        content,
        quotedPostId: originalId,
      }, client);
      await this.posts.attachMedia(post.id, mediaIds, client);
      return post.id;
    });
    void this.notifyMentions(content, user.id, 'post', postId);
    return this.getPostDetail(postId, user);
  }

  async createPlainRepostPost(user: MemberSessionUser, original: HertzPostRow): Promise<string> {
    assertMember(user);
    return withTransaction(async (client) => {
      const post = await this.posts.createPost({
        shortId: await this.generateShortId(),
        authorId: user.id,
        type: 'repost',
        source: 'web',
        category: normalizeHertzCategory(original.category),
        status: 'published',
        content: '',
        quotedPostId: original.id,
      }, client);
      return post.id;
    });
  }

  async createTelegramPost(params: {
    userId: string;
    isAdmin: boolean;
    content: string;
    category: HertzPostCategory;
    mediaIds?: string[];
    telegramMessageId?: number | null;
    telegramChatId?: number | null;
  }): Promise<string> {
    const category = normalizeHertzCategory(params.category);
    const content = cleanText(params.content);
    const status: HertzPostStatus = params.isAdmin ? 'published' : 'pending_review';
    const source: HertzPostSource = params.isAdmin ? 'admin' : 'telegram';
    return withTransaction(async (client) => {
      const post = await this.posts.createPost({
        shortId: await this.generateShortId(),
        authorId: params.userId,
        type: 'original',
        source,
        category,
        status,
        content,
        telegramMessageId: params.telegramMessageId ?? null,
        telegramChatId: params.telegramChatId ?? null,
      }, client);
      await this.posts.attachMedia(post.id, params.mediaIds ?? [], client);
      await this.logs.log({
        actor_id: params.userId,
        actor_type: params.isAdmin ? 'admin' : 'member',
        action: 'hertz.post.created',
        target_type: 'post',
        target_id: post.id,
        details: { source: 'telegram', status },
      }, client);
      return post.id;
    });
  }

  async editPost(postId: string, user: MemberSessionUser, content: string): Promise<void> {
    const post = await this.posts.findById(postId, user.id);
    if (!post) throw new HertzNotFoundError();
    if (post.author_id !== user.id && user.role !== 'admin') {
      throw new HertzForbiddenError();
    }
    await this.posts.updateContent(post.id, cleanText(content));
    void this.notifyMentions(content, user.id, 'post', post.id);
  }

  private async notifyMentions(content: string, actorUserId: string, targetType: string, targetId: string): Promise<void> {
    try {
      const userIds = await resolveMentionedUserIds(content);
      await Promise.all(userIds
        .filter((userId) => userId !== actorUserId)
        .map((userId) => this.push.notifyHertzMention({ userId, actorUserId, targetType, targetId })));
    } catch {
      // Mention push must not block the post workflow.
    }
  }

  async updateMarketContext(postId: string, user: MemberSessionUser, market: MarketContext | null): Promise<void> {
    const post = await this.posts.findById(postId, user.id);
    if (!post) throw new HertzNotFoundError();
    const isOwner = post.author_id === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) throw new HertzForbiddenError();
    if (!isAdmin && normalizeHertzCategory(post.category) !== 'trading_room') {
      throw new HertzForbiddenError('Metadata market hanya dapat diedit pada post Trading');
    }
    const nextMarket = normalizeHertzCategory(post.category) === 'trading_room'
      ? validateMarket('trading_room', market)
      : market;
    await this.posts.upsertMarketContext(post.id, nextMarket);
  }

  async deletePost(postId: string, user: MemberSessionUser): Promise<void> {
    const post = await this.posts.findById(postId, user.id);
    if (!post) throw new HertzNotFoundError();
    if (post.author_id !== user.id && user.role !== 'admin') throw new HertzForbiddenError();
    await this.posts.updateStatus(post.id, 'deleted');
  }

  private async mapPosts(rows: HertzPostRow[], viewer: MemberSessionUser | null, truncate = true, includeQuotes = true): Promise<HertzPost[]> {
    const postIds = rows.map((row) => row.id);
    const mediaRows = await this.posts.listMedia(postIds);
    const basePosts = rows.map((row) => {
      const html = row.content_html ? textToHtml(stripHtml(row.content_html)) : '';
      const text = stripHtml(html);
      const isTruncated = truncate && text.length > EXCERPT_LIMIT;
      const media: HertzMedia[] = mediaRows
        .filter((mediaRow) => mediaRow.post_id === row.id)
        .map((mediaRow) => ({
          id: mediaRow.id,
          url: mediaRow.file_url,
          type: mediaRow.media_type,
          alt: mediaRow.alt_text,
        }));
      return {
        id: row.id,
        shortId: row.short_id,
        articleId: row.article_id,
        type: row.post_type,
        source: row.source,
        category: normalizeHertzCategory(row.category),
        status: row.status,
        author: authorFromRow(row),
        content: {
          html,
          text: isTruncated ? `${text.slice(0, EXCERPT_LIMIT).trim()}...` : text,
          isTruncated,
        },
        media,
        market: this.mapMarket(row),
        quotedPost: null,
        viewer: {
          hasPulsed: Boolean(row.viewer_has_pulsed),
          hasBookmarked: Boolean(row.viewer_has_bookmarked),
          hasReposted: Boolean(row.viewer_has_reposted),
          canEdit: Boolean(viewer && (viewer.id === row.author_id || viewer.role === 'admin')),
          canDelete: Boolean(viewer && (viewer.id === row.author_id || viewer.role === 'admin')),
        },
        counts: {
          comments: Number(row.comment_count ?? 0),
          pulses: Number(row.pulse_count ?? 0),
          reposts: Number(row.repost_count ?? 0),
          views: Number(row.view_count ?? 0),
        },
        createdAt: dateToIso(row.created_at)!,
        updatedAt: dateToIso(row.updated_at)!,
        editedAt: dateToIso(row.edited_at),
      };
    });

    if (!includeQuotes) return basePosts;
    const quotedIds = Array.from(new Set(rows.map((row) => row.quoted_post_id).filter((id): id is string => Boolean(id))));
    if (quotedIds.length === 0) return basePosts;
    const quotedRows = await Promise.all(quotedIds.map((id) => this.posts.findById(id, viewer?.id ?? null)));
    const quotedPosts = await this.mapPosts(
      quotedRows.filter((row): row is HertzPostRow => Boolean(row && row.status === 'published' && !row.deleted_at)),
      viewer,
      true,
      false,
    );
    return basePosts.map((post) => ({
      ...post,
      quotedPost: post.type === 'quote' || post.type === 'repost'
        ? quotedPosts.find((quoted) => quoted.id === rows.find((row) => row.id === post.id)?.quoted_post_id) ?? null
        : null,
    }));
  }

  private async listComments(postId: string, viewer: MemberSessionUser | null): Promise<HertzComment[]> {
    const rows = await this.comments.listByPost(postId);
    return buildHertzCommentTree(rows.map((row) => this.mapComment(row, viewer)));
  }

  private mapComment(row: HertzCommentRow, viewer: MemberSessionUser | null): HertzComment {
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      parentCommentId: row.parent_comment_id,
      replies: [],
      author: {
        id: row.user_id,
        name: row.display_name ?? row.username ?? 'Member Hertz',
        username: row.username,
        badge: row.role === 'admin' ? 'admin' : 'verified_member',
        avatarUrl: row.avatar_url,
      },
      content: row.content,
      status: row.status,
      createdAt: dateToIso(row.created_at)!,
      updatedAt: dateToIso(row.updated_at)!,
      editedAt: dateToIso(row.edited_at),
      canEdit: Boolean(viewer && (viewer.id === row.user_id || viewer.role === 'admin')),
      canDelete: Boolean(viewer && (viewer.id === row.user_id || viewer.role === 'admin')),
    };
  }

  private mapMarket(row: HertzPostRow): MarketContext | null {
    if (!row.pair && !row.risk_percent && !row.timeframe && !row.direction) return null;
    return {
      pair: row.pair,
      timeframe: row.timeframe,
      riskPercent: numberOrNull(row.risk_percent),
      direction: row.direction,
      entryPrice: numberOrNull(row.entry_price),
      entryZone: row.entry_zone,
      stopLoss: numberOrNull(row.stop_loss),
      takeProfit: numberOrNull(row.take_profit),
      takeProfit1: null,
      takeProfit2: null,
      takeProfit3: null,
      setupType: row.setup_type,
      confidencePercent: numberOrNull(row.confidence_percent),
      brokerOrSource: row.broker_or_source,
    };
  }

  private async generateShortId(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const shortId = createShortIdCandidate();
      if (!(await this.posts.shortIdExists(shortId))) return shortId;
    }
    throw new HertzValidationError('Gagal membuat post id publik');
  }
}

export function hashForView(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash('sha256').update(value).digest('hex');
}

export const FeedValidationError = HertzValidationError;
export const FeedForbiddenError = HertzForbiddenError;
export const FeedNotFoundError = HertzNotFoundError;

async function awardHertzCredit(userId: string, eventType: string, entityId: string, client: DbClient): Promise<void> {
  const result = await query<{ amount: number }>(
    `INSERT INTO hertz_credit_ledger (user_id, event_type, entity_id, amount)
     SELECT $1::uuid, $2::varchar, $3::uuid, amount
     FROM hertz_credit_settings
     WHERE key = $2::varchar AND is_active = true AND amount > 0
     ON CONFLICT (user_id, event_type, entity_id) DO NOTHING
     RETURNING amount`,
    [userId, eventType, entityId],
    client,
  );
  const amount = Number(result.rows[0]?.amount ?? 0);
  if (amount > 0) {
    await execute('UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2', [amount, userId], client);
  }
}

export function buildHertzCommentTree(comments: HertzComment[]): HertzComment[] {
  const byId = new Map(comments.map((comment) => [comment.id, { ...comment, replies: [] as HertzComment[] }]));
  const roots: HertzComment[] = [];

  for (const comment of byId.values()) {
    if (!comment.parentCommentId) {
      roots.push(comment);
      continue;
    }

    let parent = byId.get(comment.parentCommentId);
    if (!parent) {
      roots.push(comment);
      continue;
    }

    while (parent.parentCommentId && byId.has(parent.parentCommentId)) {
      parent = byId.get(parent.parentCommentId)!;
    }

    parent.replies.push(comment);
  }

  return roots;
}
