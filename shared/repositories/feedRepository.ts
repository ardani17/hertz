import { execute, query, queryOne, type DbClient } from '../db';
import type { MarketContext, SignalPostCategory, SignalPostSource, SignalPostStatus, SignalPostType } from '../types/feed';

export interface FeedPostRow {
  id: string;
  article_id: string | null;
  author_id: string;
  post_type: SignalPostType;
  source: SignalPostSource;
  category: SignalPostCategory;
  status: SignalPostStatus;
  visibility: string;
  quoted_post_id: string | null;
  repost_id: string | null;
  telegram_message_id: number | null;
  telegram_chat_id: number | null;
  pinned_at: Date | null;
  edited_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  content_html: string | null;
  title: string | null;
  slug: string | null;
  author_username: string | null;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_role: 'member' | 'admin';
  author_verified_member_at: Date | null;
}

export interface FeedListRow extends FeedPostRow {
  comment_count: string;
  signal_count: string;
  repost_count: string;
  view_count: string;
  viewer_has_signaled: boolean | null;
  viewer_has_bookmarked: boolean | null;
  viewer_has_reposted: boolean | null;
  pair: string | null;
  timeframe: string | null;
  risk_percent: string | null;
  direction: string | null;
  entry_price: string | null;
  entry_zone: string | null;
  stop_loss: string | null;
  take_profit: string | null;
  take_profit_1: string | null;
  take_profit_2: string | null;
  take_profit_3: string | null;
  setup_type: string | null;
  confidence_percent: string | null;
  broker_or_source: string | null;
}

export interface MediaRow {
  id: string;
  article_id: string | null;
  file_url: string;
  media_type: 'image' | 'video';
  file_key: string | null;
  file_size: number | null;
  created_at: Date;
}

export class FeedRepository {
  async createArticle(params: {
    authorId: string;
    contentHtml: string;
    title?: string | null;
    category: string;
    source: string;
    status: string;
    slug: string;
    telegramMessageId?: number | null;
    telegramChatId?: number | null;
  }, client?: DbClient): Promise<{ id: string; slug: string }> {
    const article = await queryOne<{ id: string; slug: string }>(
      `INSERT INTO articles (
         author_id, content_html, title, category, source, status, slug,
         telegram_message_id, telegram_chat_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, slug`,
      [
        params.authorId,
        params.contentHtml,
        params.title ?? null,
        params.category,
        params.source,
        params.status,
        params.slug,
        params.telegramMessageId ?? null,
        params.telegramChatId ?? null,
      ],
      client,
    );

    if (!article) throw new Error('Failed to create article');
    return article;
  }

  async createFeedPost(params: {
    articleId?: string | null;
    authorId: string;
    postType: SignalPostType;
    source: SignalPostSource;
    category: SignalPostCategory;
    status: SignalPostStatus;
    quotedPostId?: string | null;
    repostId?: string | null;
    telegramMessageId?: number | null;
    telegramChatId?: number | null;
  }, client?: DbClient): Promise<FeedPostRow> {
    const row = await queryOne<FeedPostRow>(
      `INSERT INTO feed_posts (
         article_id, author_id, post_type, source, category, status,
         quoted_post_id, repost_id, telegram_message_id, telegram_chat_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *, NULL::text AS content_html, NULL::text AS title, NULL::text AS slug,
                 NULL::text AS author_username, NULL::text AS author_display_name,
                 NULL::text AS author_avatar_url, 'member'::text AS author_role,
                 NULL::timestamp with time zone AS author_verified_member_at`,
      [
        params.articleId ?? null,
        params.authorId,
        params.postType,
        params.source,
        params.category,
        params.status,
        params.quotedPostId ?? null,
        params.repostId ?? null,
        params.telegramMessageId ?? null,
        params.telegramChatId ?? null,
      ],
      client,
    );

    if (!row) throw new Error('Failed to create feed post');
    return row;
  }

  async attachMediaToArticle(articleId: string, mediaIds: string[], client?: DbClient): Promise<void> {
    if (mediaIds.length === 0) return;
    await execute(
      `UPDATE media SET article_id = $1 WHERE id = ANY($2::uuid[])`,
      [articleId, mediaIds],
      client,
    );
  }

  async upsertMarketContext(postId: string, market: MarketContext | null | undefined, client?: DbClient): Promise<void> {
    if (!market) return;
    await execute(
      `INSERT INTO post_market_context (
         post_id, pair, timeframe, risk_percent, direction, entry_price, entry_zone,
         stop_loss, take_profit, take_profit_1, take_profit_2, take_profit_3,
         setup_type, confidence_percent, broker_or_source, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
       ON CONFLICT (post_id)
       DO UPDATE SET
         pair = EXCLUDED.pair,
         timeframe = EXCLUDED.timeframe,
         risk_percent = EXCLUDED.risk_percent,
         direction = EXCLUDED.direction,
         entry_price = EXCLUDED.entry_price,
         entry_zone = EXCLUDED.entry_zone,
         stop_loss = EXCLUDED.stop_loss,
         take_profit = EXCLUDED.take_profit,
         take_profit_1 = EXCLUDED.take_profit_1,
         take_profit_2 = EXCLUDED.take_profit_2,
         take_profit_3 = EXCLUDED.take_profit_3,
         setup_type = EXCLUDED.setup_type,
         confidence_percent = EXCLUDED.confidence_percent,
         broker_or_source = EXCLUDED.broker_or_source,
         updated_at = NOW()`,
      [
        postId,
        market.pair ?? null,
        market.timeframe ?? null,
        market.riskPercent ?? null,
        market.direction ?? null,
        market.entryPrice ?? null,
        market.entryZone ?? null,
        market.stopLoss ?? null,
        market.takeProfit ?? null,
        market.takeProfit1 ?? null,
        market.takeProfit2 ?? null,
        market.takeProfit3 ?? null,
        market.setupType ?? null,
        market.confidencePercent ?? null,
        market.brokerOrSource ?? null,
      ],
      client,
    );
  }

  async listPublished(params: {
    limit: number;
    cursorCreatedAt?: string | null;
    cursorId?: string | null;
    category?: string | null;
    viewerId?: string | null;
  }, client?: DbClient): Promise<FeedListRow[]> {
    const conditions = ['fp.status = $1', 'fp.deleted_at IS NULL'];
    const values: unknown[] = ['published'];
    let idx = 2;

    if (params.category) {
      conditions.push(`fp.category = $${idx}`);
      values.push(params.category);
      idx++;
    }

    if (params.cursorCreatedAt && params.cursorId) {
      conditions.push(`(fp.created_at, fp.id) < ($${idx}::timestamptz, $${idx + 1}::uuid)`);
      values.push(params.cursorCreatedAt, params.cursorId);
      idx += 2;
    }

    values.push(params.viewerId ?? null, params.limit);
    const viewerParam = idx;
    const limitParam = idx + 1;

    const result = await query<FeedListRow>(
      `SELECT fp.*, a.content_html, a.title, a.slug,
              u.username AS author_username,
              u.display_name AS author_display_name,
              u.avatar_url AS author_avatar_url,
              u.role AS author_role,
              u.verified_member_at AS author_verified_member_at,
              COALESCE(pc.comment_count, 0)::text AS comment_count,
              COALESCE(pr.signal_count, 0)::text AS signal_count,
              COALESCE(rr.repost_count, 0)::text AS repost_count,
              COALESCE(pv.view_count, 0)::text AS view_count,
              vr.id IS NOT NULL AS viewer_has_signaled,
              vb.id IS NOT NULL AS viewer_has_bookmarked,
              vrr.id IS NOT NULL AS viewer_has_reposted,
              pmc.pair, pmc.timeframe, pmc.risk_percent::text, pmc.direction,
              pmc.entry_price::text, pmc.entry_zone, pmc.stop_loss::text,
              pmc.take_profit::text, pmc.take_profit_1::text, pmc.take_profit_2::text,
              pmc.take_profit_3::text, pmc.setup_type, pmc.confidence_percent::text,
              pmc.broker_or_source
       FROM feed_posts fp
       LEFT JOIN articles a ON a.id = fp.article_id
       LEFT JOIN users u ON u.id = fp.author_id
       LEFT JOIN post_market_context pmc ON pmc.post_id = fp.id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS comment_count FROM post_comments c
         WHERE c.post_id = fp.id AND c.status = 'visible' AND c.deleted_at IS NULL
       ) pc ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS signal_count FROM post_reactions r
         WHERE r.post_id = fp.id AND r.reaction_type = 'signal' AND r.deleted_at IS NULL
       ) pr ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS repost_count FROM post_reposts r
         WHERE r.original_post_id = fp.id AND r.deleted_at IS NULL
       ) rr ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS view_count FROM post_views v WHERE v.post_id = fp.id
       ) pv ON true
       LEFT JOIN post_reactions vr
         ON vr.post_id = fp.id AND vr.user_id = $${viewerParam}::uuid AND vr.reaction_type = 'signal' AND vr.deleted_at IS NULL
       LEFT JOIN post_bookmarks vb
         ON vb.post_id = fp.id AND vb.user_id = $${viewerParam}::uuid AND vb.deleted_at IS NULL
       LEFT JOIN post_reposts vrr
         ON vrr.original_post_id = fp.id AND vrr.user_id = $${viewerParam}::uuid AND vrr.repost_type = 'repost' AND vrr.deleted_at IS NULL
       WHERE ${conditions.join(' AND ')}
       ORDER BY fp.pinned_at DESC NULLS LAST, fp.created_at DESC, fp.id DESC
       LIMIT $${limitParam}`,
      values,
      client,
    );
    return result.rows;
  }

  async findById(postId: string, viewerId?: string | null, client?: DbClient): Promise<FeedListRow | null> {
    const rows = await query<FeedListRow>(
      `SELECT * FROM (
        SELECT fp.created_at AS cursor_created_at, fp.id AS cursor_id
        FROM feed_posts fp WHERE fp.id = $1
      ) cursor_marker
      RIGHT JOIN LATERAL (
        SELECT fp.*, a.content_html, a.title, a.slug,
               u.username AS author_username, u.display_name AS author_display_name,
               u.avatar_url AS author_avatar_url, u.role AS author_role,
               u.verified_member_at AS author_verified_member_at,
               COALESCE(pc.comment_count, 0)::text AS comment_count,
               COALESCE(pr.signal_count, 0)::text AS signal_count,
               COALESCE(rr.repost_count, 0)::text AS repost_count,
               COALESCE(pv.view_count, 0)::text AS view_count,
               vr.id IS NOT NULL AS viewer_has_signaled,
               vb.id IS NOT NULL AS viewer_has_bookmarked,
               vrr.id IS NOT NULL AS viewer_has_reposted,
               pmc.pair, pmc.timeframe, pmc.risk_percent::text, pmc.direction,
               pmc.entry_price::text, pmc.entry_zone, pmc.stop_loss::text,
               pmc.take_profit::text, pmc.take_profit_1::text, pmc.take_profit_2::text,
               pmc.take_profit_3::text, pmc.setup_type, pmc.confidence_percent::text,
               pmc.broker_or_source
        FROM feed_posts fp
        LEFT JOIN articles a ON a.id = fp.article_id
        LEFT JOIN users u ON u.id = fp.author_id
        LEFT JOIN post_market_context pmc ON pmc.post_id = fp.id
        LEFT JOIN LATERAL (SELECT COUNT(*) AS comment_count FROM post_comments c WHERE c.post_id = fp.id AND c.status = 'visible' AND c.deleted_at IS NULL) pc ON true
        LEFT JOIN LATERAL (SELECT COUNT(*) AS signal_count FROM post_reactions r WHERE r.post_id = fp.id AND r.reaction_type = 'signal' AND r.deleted_at IS NULL) pr ON true
        LEFT JOIN LATERAL (SELECT COUNT(*) AS repost_count FROM post_reposts r WHERE r.original_post_id = fp.id AND r.deleted_at IS NULL) rr ON true
        LEFT JOIN LATERAL (SELECT COUNT(*) AS view_count FROM post_views v WHERE v.post_id = fp.id) pv ON true
        LEFT JOIN post_reactions vr ON vr.post_id = fp.id AND vr.user_id = $2::uuid AND vr.reaction_type = 'signal' AND vr.deleted_at IS NULL
        LEFT JOIN post_bookmarks vb ON vb.post_id = fp.id AND vb.user_id = $2::uuid AND vb.deleted_at IS NULL
        LEFT JOIN post_reposts vrr ON vrr.original_post_id = fp.id AND vrr.user_id = $2::uuid AND vrr.repost_type = 'repost' AND vrr.deleted_at IS NULL
        WHERE fp.id = $1
      ) fp ON true`,
      [postId, viewerId ?? null],
      client,
    );
    return rows.rows[0] ?? null;
  }

  async findRawById(postId: string, client?: DbClient): Promise<FeedPostRow | null> {
    return queryOne<FeedPostRow>(
      `SELECT fp.*, a.content_html, a.title, a.slug,
              u.username AS author_username, u.display_name AS author_display_name,
              u.avatar_url AS author_avatar_url, u.role AS author_role,
              u.verified_member_at AS author_verified_member_at
       FROM feed_posts fp
       LEFT JOIN articles a ON a.id = fp.article_id
       LEFT JOIN users u ON u.id = fp.author_id
       WHERE fp.id = $1`,
      [postId],
      client,
    );
  }

  async listMedia(articleIds: string[], client?: DbClient): Promise<MediaRow[]> {
    if (articleIds.length === 0) return [];
    const result = await query<MediaRow>(
      `SELECT * FROM media WHERE article_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
      [articleIds],
      client,
    );
    return result.rows;
  }

  async updateArticleContent(articleId: string, contentHtml: string, client?: DbClient): Promise<void> {
    await execute(
      'UPDATE articles SET content_html = $1 WHERE id = $2',
      [contentHtml, articleId],
      client,
    );
  }

  async updatePostStatus(postId: string, status: SignalPostStatus, client?: DbClient): Promise<void> {
    await execute(
      'UPDATE feed_posts SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, postId],
      client,
    );
  }

  async softDeletePost(postId: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE feed_posts SET status = 'deleted', deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [postId],
      client,
    );
  }

  async markEdited(postId: string, client?: DbClient): Promise<void> {
    await execute(
      'UPDATE feed_posts SET edited_at = NOW(), updated_at = NOW() WHERE id = $1',
      [postId],
      client,
    );
  }

  async publishTelegramDraft(postId: string, client?: DbClient): Promise<FeedPostRow | null> {
    return queryOne<FeedPostRow>(
      `UPDATE feed_posts
       SET status = 'published', updated_at = NOW()
       WHERE id = $1 AND status IN ('draft', 'pending_review')
       RETURNING *, NULL::text AS content_html, NULL::text AS title, NULL::text AS slug,
                 NULL::text AS author_username, NULL::text AS author_display_name,
                 NULL::text AS author_avatar_url, 'member'::text AS author_role,
                 NULL::timestamp with time zone AS author_verified_member_at`,
      [postId],
      client,
    );
  }
}
