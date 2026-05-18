import { createHash, randomBytes } from 'crypto';
import { execute, withTransaction } from '../db';
import { FeedRepository, type FeedListRow } from '../repositories/feedRepository';
import { CommunityNoteRepository } from '../repositories/communityNoteRepository';
import { PostCommentRepository, type PostCommentRow } from '../repositories/postCommentRepository';
import { PostRepostRepository } from '../repositories/postRepostRepository';
import { CreditService } from './creditService';
import { ActivityLogService } from './activityLog';
import { textToHtml, stripHtml } from '../utils/textToHtml';
import { extractFirstWords, slugify } from '../utils/slugify';
import type {
  CursorFeedResult,
  MarketContext,
  RepostInput,
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
import type { CommunityNote, CommunityNoteSource } from '../types/communityNote';
import type { MemberSessionUser } from '../types/membership';

const FEED_EXCERPT_LIMIT = 420;
const EDIT_WINDOW_MS = 15 * 60 * 1000;
const VALID_CATEGORIES: HertzPostCategory[] = ['trading', 'life_story', 'general'];
const SHORT_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export class FeedValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedValidationError';
  }
}

export class FeedForbiddenError extends Error {
  constructor(message = 'Akses ditolak') {
    super(message);
    this.name = 'FeedForbiddenError';
  }
}

export class FeedNotFoundError extends Error {
  constructor(message = 'Post tidak ditemukan') {
    super(message);
    this.name = 'FeedNotFoundError';
  }
}

function assertMember(user: MemberSessionUser | null): asserts user is MemberSessionUser {
  if (!user) throw new FeedForbiddenError('Login member diperlukan');
}

function normalizeCategory(category: unknown): HertzPostCategory {
  if (typeof category === 'string' && VALID_CATEGORIES.includes(category as HertzPostCategory)) {
    return category as HertzPostCategory;
  }
  throw new FeedValidationError('Kategori tidak valid');
}

function cleanText(value: unknown, max = 12000): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new FeedValidationError('Konten tidak boleh kosong');
  if (text.length > max) throw new FeedValidationError(`Konten maksimal ${max} karakter`);
  return text;
}

function optionalMediaIds(value: unknown): string[] {
  if (!value) return [];
  if (!Array.isArray(value)) throw new FeedValidationError('mediaIds harus array');
  const ids = value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  if (ids.length > 4) throw new FeedValidationError('Maksimal 4 media per post');
  return ids;
}

function createShortIdCandidate(): string {
  const bytes = randomBytes(8);
  let suffix = '';
  for (const byte of bytes) {
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
    if (!parsed.createdAt || !parsed.id) return null;
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

function authorFromRow(row: FeedListRow | PostCommentRow): HertzAuthor {
  const username = 'author_username' in row ? row.author_username : row.username;
  const name = ('display_name' in row ? row.display_name : null)
    ?? ('author_display_name' in row ? row.author_display_name : null)
    ?? username
    ?? 'Member Horizon';
  const role = 'author_role' in row ? row.author_role : row.role;
  return {
    id: 'author_id' in row ? row.author_id : row.user_id,
    name,
    username,
    badge: role === 'admin' ? 'admin' : 'verified_member',
    avatarUrl: 'author_avatar_url' in row ? row.author_avatar_url : row.avatar_url,
  };
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

export class FeedService {
  private readonly feedRepo = new FeedRepository();
  private readonly noteRepo = new CommunityNoteRepository();
  private readonly commentRepo = new PostCommentRepository();
  private readonly repostRepo = new PostRepostRepository();
  private readonly credit = new CreditService();
  private readonly logs = new ActivityLogService();

  async listFeed(params: {
    cursor?: string | null;
    limit?: number;
    category?: string | null;
    viewer?: MemberSessionUser | null;
  }): Promise<CursorFeedResult> {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const decoded = decodeCursor(params.cursor ?? null);
    const category = params.category ? normalizeCategory(params.category) : null;
    const rows = await this.feedRepo.listPublished({
      limit: limit + 1,
      cursorCreatedAt: decoded?.createdAt ?? null,
      cursorId: decoded?.id ?? null,
      category,
      viewerId: params.viewer?.id ?? null,
    });
    const pageRows = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? encodeCursor(rows[limit]) : null;
    const posts = await this.mapPosts(pageRows, params.viewer ?? null);
    return { items: posts, nextCursor };
  }

  async getPostDetail(postId: string, viewer?: MemberSessionUser | null): Promise<HertzPostDetail> {
    const row = await this.feedRepo.findById(postId, viewer?.id ?? null);
    if (!row || row.status !== 'published' || row.deleted_at) {
      throw new FeedNotFoundError();
    }
    const [post] = await this.mapPosts([row], viewer ?? null, false);
    const [comments, communityNotes] = await Promise.all([
      this.listComments(row.id, viewer ?? null),
      this.listCommunityNotes(row.id, viewer ?? null),
    ]);
    return { ...post, comments, communityNotes };
  }

  async createWebPost(user: MemberSessionUser, input: HertzPostInput): Promise<HertzPost> {
    assertMember(user);
    const category = normalizeCategory(input.category);
    const content = cleanText(input.content);
    const mediaIds = optionalMediaIds(input.mediaIds);
    const contentHtml = textToHtml(content);
    const slug = slugify(extractFirstWords(content, 8));
    const title = extractFirstWords(content, 12);
    const market = category === 'trading' ? input.market ?? null : null;

    const postId = await withTransaction(async (client) => {
      const article = await this.feedRepo.createArticle({
        authorId: user.id,
        contentHtml,
        title,
        category,
        source: 'web',
        status: 'published',
        slug,
      }, client);
      await this.feedRepo.attachMediaToArticle(article.id, mediaIds, client);
      const post = await this.feedRepo.createFeedPost({
        shortId: await this.generateShortId(),
        articleId: article.id,
        authorId: user.id,
        postType: 'original',
        source: 'web',
        category,
        status: 'published',
      }, client);
      await this.feedRepo.upsertMarketContext(post.id, market, client);
      await this.credit.awardCreditForArticle({
        userId: user.id,
        articleId: article.id,
        category,
        client,
      });
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.post.created',
        target_type: 'post',
        target_id: post.id,
        details: { source: 'web', category, article_id: article.id },
      }, client);
      return post.id;
    });

    return this.getPostDetail(postId, user);
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
    const content = cleanText(params.content);
    const status: HertzPostStatus = params.isAdmin ? 'published' : 'pending_review';
    const contentHtml = textToHtml(content);
    const slug = slugify(extractFirstWords(content, 8));
    const source: HertzPostSource = params.isAdmin ? 'admin' : 'telegram';

    return withTransaction(async (client) => {
      const article = await this.feedRepo.createArticle({
        authorId: params.userId,
        contentHtml,
        title: extractFirstWords(content, 12),
        category: params.category,
        source: 'telegram',
        status: params.isAdmin ? 'published' : 'draft',
        slug,
        telegramMessageId: params.telegramMessageId ?? null,
        telegramChatId: params.telegramChatId ?? null,
      }, client);
      await this.feedRepo.attachMediaToArticle(article.id, params.mediaIds ?? [], client);
      const post = await this.feedRepo.createFeedPost({
        shortId: await this.generateShortId(),
        articleId: article.id,
        authorId: params.userId,
        postType: 'original',
        source,
        category: params.category,
        status,
        telegramMessageId: params.telegramMessageId ?? null,
        telegramChatId: params.telegramChatId ?? null,
      }, client);
      if (params.isAdmin) {
        await this.credit.awardCreditForArticle({
          userId: params.userId,
          articleId: article.id,
          category: params.category,
          client,
        });
      }
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

  async publishTelegramDraft(postId: string, admin: MemberSessionUser): Promise<void> {
    if (admin.role !== 'admin') throw new FeedForbiddenError();
    await withTransaction(async (client) => {
      const post = await this.feedRepo.findRawById(postId, client);
      if (!post) throw new FeedNotFoundError();
      if (post.status === 'published') return;
      if (post.status !== 'pending_review' && post.status !== 'draft') {
        throw new FeedValidationError('Post bukan draft Telegram');
      }
      await this.feedRepo.updatePostStatus(post.id, 'published', client);
      if (post.article_id) {
        await execute('UPDATE articles SET status = $1 WHERE id = $2', ['published', post.article_id], client);
        await this.credit.awardCreditForArticle({
          userId: post.author_id,
          articleId: post.article_id,
          category: post.category,
          client,
        });
      }
      await this.logs.log({
        actor_id: admin.id,
        actor_type: 'admin',
        action: 'hertz.post.published',
        target_type: 'post',
        target_id: post.id,
        details: { article_id: post.article_id },
      }, client);
    });
  }

  async editPost(postId: string, user: MemberSessionUser, content: string): Promise<void> {
    const post = await this.feedRepo.findRawById(postId);
    if (!post || !post.article_id) throw new FeedNotFoundError();
    const isOwner = post.author_id === user.id;
    const isAdmin = user.role === 'admin';
    const createdAt = post.created_at instanceof Date ? post.created_at : new Date(post.created_at);
    if (!isAdmin && (!isOwner || Date.now() - createdAt.getTime() > EDIT_WINDOW_MS)) {
      throw new FeedForbiddenError();
    }
    const cleaned = cleanText(content);
    await withTransaction(async (client) => {
      await this.feedRepo.updateArticleContent(post.article_id!, textToHtml(cleaned), client);
      await this.feedRepo.markEdited(postId, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.post.edited',
        target_type: 'post',
        target_id: postId,
      }, client);
    });
  }

  async updateMarketContext(postId: string, user: MemberSessionUser, market: MarketContext | null): Promise<void> {
    if (user.role !== 'admin') throw new FeedForbiddenError('Akses admin diperlukan');
    const post = await this.feedRepo.findRawById(postId);
    if (!post) throw new FeedNotFoundError();
    await withTransaction(async (client) => {
      await this.feedRepo.upsertMarketContext(post.id, market, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: 'admin',
        action: 'hertz.market_context.edited',
        target_type: 'post',
        target_id: post.id,
        details: { market },
      }, client);
    });
  }

  async deletePost(postId: string, user: MemberSessionUser): Promise<void> {
    const post = await this.feedRepo.findRawById(postId);
    if (!post) throw new FeedNotFoundError();
    if (post.author_id !== user.id && user.role !== 'admin') throw new FeedForbiddenError();
    await withTransaction(async (client) => {
      await this.feedRepo.softDeletePost(post.id, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.post.deleted',
        target_type: 'post',
        target_id: post.id,
      }, client);
    });
  }

  async createRepost(postId: string, user: MemberSessionUser, input: RepostInput): Promise<{ active?: boolean; post?: HertzPost }> {
    const original = await this.feedRepo.findRawById(postId);
    if (!original || original.status !== 'published' || original.deleted_at) throw new FeedNotFoundError();
    if (input.type === 'repost') {
      if (original.author_id === user.id) throw new FeedValidationError('Tidak bisa repost post sendiri');
      const result = await this.repostRepo.togglePlainRepost(original.id, user.id);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: result.active ? 'hertz.repost.created' : 'hertz.repost.deleted',
        target_type: 'post',
        target_id: original.id,
      });
      return { active: result.active };
    }

    const content = cleanText(input.content, 4000);
    const mediaIds = optionalMediaIds(input.mediaIds);
    const quotePostId = await withTransaction(async (client) => {
      const article = await this.feedRepo.createArticle({
        authorId: user.id,
        contentHtml: textToHtml(content),
        title: extractFirstWords(content, 12),
        category: original.category,
        source: 'web',
        status: 'published',
        slug: slugify(extractFirstWords(content, 8)),
      }, client);
      await this.feedRepo.attachMediaToArticle(article.id, mediaIds, client);
      const post = await this.feedRepo.createFeedPost({
        shortId: await this.generateShortId(),
        articleId: article.id,
        authorId: user.id,
        postType: 'quote',
        source: 'web',
        category: original.category,
        status: 'published',
        quotedPostId: original.id,
      }, client);
      await this.repostRepo.createQuote(original.id, user.id, post.id, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.repost.created',
        target_type: 'post',
        target_id: original.id,
        details: { quote_post_id: post.id },
      }, client);
      return post.id;
    });
    return { post: await this.getPostDetail(quotePostId, user) };
  }

  async listComments(postId: string, viewer: MemberSessionUser | null): Promise<HertzComment[]> {
    const rows = await this.commentRepo.listByPost(postId);
    return rows.map((row) => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      parentCommentId: row.parent_comment_id,
      replies: [],
      author: authorFromRow(row),
      content: row.content,
      status: row.status,
      createdAt: dateToIso(row.created_at)!,
      updatedAt: dateToIso(row.updated_at)!,
      editedAt: dateToIso(row.edited_at),
      canEdit: Boolean(viewer && (viewer.id === row.user_id || viewer.role === 'admin')),
      canDelete: Boolean(viewer && (viewer.id === row.user_id || viewer.role === 'admin')),
    }));
  }

  private async mapPosts(
    rows: FeedListRow[],
    viewer: MemberSessionUser | null,
    truncate = true,
    includeQuotes = true,
  ): Promise<HertzPost[]> {
    const articleIds = rows.map((row) => row.article_id).filter((id): id is string => Boolean(id));
    const postIds = rows.map((row) => row.id);
    const [mediaRows, primaryNotes] = await Promise.all([
      this.feedRepo.listMedia(articleIds),
      this.noteRepo.listPrimaryForPosts(postIds, viewer?.id ?? null),
    ]);
    const sources = await this.noteRepo.listSources(primaryNotes.map((note) => note.id));

    const basePosts = rows.map((row) => {
      const html = row.content_html ?? '';
      const text = stripHtml(html);
      const isTruncated = truncate && text.length > FEED_EXCERPT_LIMIT;
      const media: HertzMedia[] = mediaRows
        .filter((mediaRow) => mediaRow.article_id === row.article_id)
        .map((mediaRow) => ({
          id: mediaRow.id,
          url: mediaRow.file_url,
          type: mediaRow.media_type,
          alt: null,
        }));
      const note = primaryNotes.find((candidate) => candidate.post_id === row.id) ?? null;

      return {
        id: row.id,
        shortId: row.short_id,
        articleId: row.article_id,
        type: row.post_type,
        source: row.source,
        category: row.category,
        status: row.status,
        author: authorFromRow(row),
        content: {
          html,
          text: isTruncated ? `${text.slice(0, FEED_EXCERPT_LIMIT).trim()}...` : text,
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
        primaryCommunityNote: note ? this.mapCommunityNote(note, sources) : null,
        createdAt: dateToIso(row.created_at)!,
        updatedAt: dateToIso(row.updated_at)!,
        editedAt: dateToIso(row.edited_at),
      };
    });

    if (!includeQuotes) {
      return basePosts;
    }

    const quotedIds = Array.from(new Set(rows.map((row) => row.quoted_post_id).filter((id): id is string => Boolean(id))));
    if (quotedIds.length === 0) {
      return basePosts;
    }

    const quotedRows = await Promise.all(quotedIds.map((id) => this.feedRepo.findById(id, viewer?.id ?? null)));
    const quotedPosts = await this.mapPosts(
      quotedRows.filter((row): row is FeedListRow => Boolean(row && row.status === 'published' && !row.deleted_at)),
      viewer,
      true,
      false,
    );

    return basePosts.map((post) => ({
      ...post,
      quotedPost: post.type === 'quote'
        ? quotedPosts.find((quoted) => quoted.id === rows.find((row) => row.id === post.id)?.quoted_post_id) ?? null
        : null,
    }));
  }

  private async listCommunityNotes(postId: string, viewer: MemberSessionUser | null): Promise<CommunityNote[]> {
    const notes = await this.noteRepo.listByPost(postId, viewer?.id ?? null);
    const sources = await this.noteRepo.listSources(notes.map((note) => note.id));
    return notes.map((note) => this.mapCommunityNote(note, sources));
  }

  private mapCommunityNote(note: {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    status: 'published' | 'hidden' | 'deleted';
    helpful_count: number;
    not_helpful_count: number;
    rating: 'helpful' | 'not_helpful' | null;
    username: string | null;
    display_name: string | null;
    created_at: Date;
    updated_at: Date;
    edited_at: Date | null;
  }, sourceRows: Array<{
    id: string;
    note_id: string;
    source_url: string;
    source_title: string | null;
    created_at: Date;
  }>): CommunityNote {
    const noteSources: CommunityNoteSource[] = sourceRows
      .filter((source) => source.note_id === note.id)
      .map((source) => ({
        id: source.id,
        noteId: source.note_id,
        url: source.source_url,
        title: source.source_title,
        createdAt: dateToIso(source.created_at)!,
      }));
    return {
      id: note.id,
      postId: note.post_id,
      authorId: note.author_id,
      authorName: note.display_name ?? note.username ?? 'Member Horizon',
      content: note.content,
      status: note.status,
      helpfulCount: note.helpful_count,
      notHelpfulCount: note.not_helpful_count,
      viewerRating: note.rating,
      sources: noteSources,
      createdAt: dateToIso(note.created_at)!,
      updatedAt: dateToIso(note.updated_at)!,
      editedAt: dateToIso(note.edited_at),
    };
  }

  private mapMarket(row: FeedListRow): MarketContext | null {
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
      takeProfit1: numberOrNull(row.take_profit_1),
      takeProfit2: numberOrNull(row.take_profit_2),
      takeProfit3: numberOrNull(row.take_profit_3),
      setupType: row.setup_type,
      confidencePercent: numberOrNull(row.confidence_percent),
      brokerOrSource: row.broker_or_source,
    };
  }

  private async generateShortId(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const shortId = createShortIdCandidate();
      if (!(await this.feedRepo.shortIdExists(shortId))) {
        return shortId;
      }
    }
    throw new FeedValidationError('Gagal membuat post id publik');
  }
}

export function hashForView(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash('sha256').update(value).digest('hex');
}
