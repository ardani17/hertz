import { execute, query, queryOne, type DbClient } from '../db';
import type { MarketContext, SignalPostCategory, SignalPostSource, SignalPostStatus, SignalPostType } from '../types/feed';

export interface HertzPostRow {
  id: string;
  short_id: string;
  article_id: string | null;
  author_id: string;
  post_type: SignalPostType;
  source: SignalPostSource;
  category: SignalPostCategory;
  status: SignalPostStatus;
  visibility: string;
  quoted_post_id: string | null;
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
  comment_count: string;
  pulse_count: string;
  repost_count: string;
  view_count: string;
  viewer_has_pulsed: boolean | null;
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
  setup_type: string | null;
  confidence_percent: string | null;
  broker_or_source: string | null;
}

export interface HertzMediaRow {
  id: string;
  post_id: string;
  file_url: string;
  media_type: 'image' | 'video';
  alt_text: string | null;
  sort_order: number;
}

export class HertzPostRepository {
  async shortIdExists(shortId: string, client?: DbClient): Promise<boolean> {
    const row = await queryOne<{ id: string }>('SELECT id FROM hertz_posts WHERE short_id = $1', [shortId], client);
    return Boolean(row);
  }

  async resolvePostId(postIdOrShortId: string, client?: DbClient): Promise<string | null> {
    const row = await queryOne<{ id: string }>(
      'SELECT id FROM hertz_posts WHERE id::text = $1 OR short_id = $1',
      [postIdOrShortId],
      client,
    );
    return row?.id ?? null;
  }

  async createPost(params: {
    shortId: string;
    articleId?: string | null;
    authorId: string;
    type: SignalPostType;
    source: SignalPostSource;
    category: SignalPostCategory;
    status: SignalPostStatus;
    content: string;
    quotedPostId?: string | null;
    telegramMessageId?: number | null;
    telegramChatId?: number | null;
  }, client?: DbClient): Promise<{ id: string; short_id: string }> {
    const row = await queryOne<{ id: string; short_id: string }>(
      `INSERT INTO hertz_posts (
         short_id, article_id, author_id, type, source, category, status, content,
         quoted_post_id, telegram_message_id, telegram_chat_id, published_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         CASE WHEN $7 = 'published' THEN NOW() ELSE NULL END)
       RETURNING id, short_id`,
      [
        params.shortId,
        params.articleId ?? null,
        params.authorId,
        params.type,
        params.source,
        params.category,
        params.status,
        params.content,
        params.quotedPostId ?? null,
        params.telegramMessageId ?? null,
        params.telegramChatId ?? null,
      ],
      client,
    );
    if (!row) throw new Error('Failed to create HERTZ post');
    return row;
  }

  async attachMedia(postId: string, mediaIds: string[], client?: DbClient): Promise<void> {
    if (mediaIds.length === 0) return;
    await execute(
      `INSERT INTO hertz_post_media (post_id, media_id, file_url, media_type, file_key, file_size, sort_order)
       SELECT $1, m.id, m.file_url, m.media_type, m.file_key, m.file_size,
              row_number() over (order by m.created_at, m.id) - 1
       FROM media m
       WHERE m.id = ANY($2::uuid[])
       ON CONFLICT DO NOTHING`,
      [postId, mediaIds],
      client,
    );
  }

  async upsertMarketContext(postId: string, market: MarketContext | null | undefined, client?: DbClient): Promise<void> {
    if (!market) return;
    await execute(
      `INSERT INTO hertz_post_market_context (
         post_id, pair, timeframe, risk_percent, direction, entry_price,
         entry_zone, stop_loss, take_profit, setup_type, confidence_percent,
         broker_or_source, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (post_id) DO UPDATE SET
         pair = EXCLUDED.pair,
         timeframe = EXCLUDED.timeframe,
         risk_percent = EXCLUDED.risk_percent,
         direction = EXCLUDED.direction,
         entry_price = EXCLUDED.entry_price,
         entry_zone = EXCLUDED.entry_zone,
         stop_loss = EXCLUDED.stop_loss,
         take_profit = EXCLUDED.take_profit,
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
  }, client?: DbClient): Promise<HertzPostRow[]> {
    const conditions = ['hp.status = $1', 'hp.deleted_at IS NULL'];
    const values: unknown[] = ['published'];
    let idx = 2;

    if (params.category) {
      conditions.push(`hp.category = $${idx}`);
      values.push(params.category);
      idx++;
    }

    if (params.cursorCreatedAt && params.cursorId) {
      conditions.push(`(hp.created_at, hp.id) < ($${idx}::timestamptz, $${idx + 1}::uuid)`);
      values.push(params.cursorCreatedAt, params.cursorId);
      idx += 2;
    }

    values.push(params.viewerId ?? null, params.limit);
    return this.queryRows(conditions.join(' AND '), values, idx, idx + 1, client);
  }

  async findById(postId: string, viewerId?: string | null, client?: DbClient): Promise<HertzPostRow | null> {
    const rows = await this.queryRows('(hp.id::text = $1 OR hp.short_id = $1)', [postId, viewerId ?? null, 1], 2, 3, client);
    return rows[0] ?? null;
  }

  async listMedia(postIds: string[], client?: DbClient): Promise<HertzMediaRow[]> {
    if (postIds.length === 0) return [];
    const result = await query<HertzMediaRow>(
      `SELECT id, post_id, file_url, media_type, alt_text, sort_order
       FROM hertz_post_media
       WHERE post_id = ANY($1::uuid[])
       ORDER BY post_id, sort_order ASC, created_at ASC`,
      [postIds],
      client,
    );
    return result.rows;
  }

  async updateContent(postId: string, content: string, client?: DbClient): Promise<void> {
    await execute(
      'UPDATE hertz_posts SET content = $1, edited_at = NOW(), updated_at = NOW() WHERE id = $2 OR short_id = $2',
      [content, postId],
      client,
    );
  }

  async updateStatus(postId: string, status: SignalPostStatus, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE hertz_posts
       SET status = $2,
           published_at = CASE WHEN $2 = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END,
           deleted_at = CASE WHEN $2 = 'deleted' THEN NOW() ELSE deleted_at END,
           updated_at = NOW()
       WHERE id = $1 OR short_id = $1`,
      [postId, status],
      client,
    );
  }

  private async queryRows(whereSql: string, values: unknown[], viewerParam: number, limitParam: number, client?: DbClient): Promise<HertzPostRow[]> {
    const result = await query<HertzPostRow>(
      `SELECT hp.id, hp.short_id, hp.article_id, hp.author_id,
              hp.type AS post_type, hp.source, hp.category, hp.status, hp.visibility,
              hp.quoted_post_id, hp.telegram_message_id, hp.telegram_chat_id,
              hp.pinned_at, hp.edited_at, hp.deleted_at, hp.created_at, hp.updated_at,
              COALESCE(a.content_html, hp.content, '') AS content_html,
              a.title, a.slug,
              u.username AS author_username,
              u.display_name AS author_display_name,
              u.avatar_url AS author_avatar_url,
              u.role AS author_role,
              u.verified_member_at AS author_verified_member_at,
              COALESCE(cc.comment_count, 0)::text AS comment_count,
              COALESCE(rc.pulse_count, 0)::text AS pulse_count,
              COALESCE(rp.repost_count, 0)::text AS repost_count,
              COALESCE(vc.view_count, 0)::text AS view_count,
              vr.id IS NOT NULL AS viewer_has_pulsed,
              vb.id IS NOT NULL AS viewer_has_bookmarked,
              vrr.id IS NOT NULL AS viewer_has_reposted,
              pmc.pair, pmc.timeframe, pmc.risk_percent::text, pmc.direction,
              pmc.entry_price::text, pmc.entry_zone, pmc.stop_loss::text,
              pmc.take_profit::text, pmc.setup_type, pmc.confidence_percent::text,
              pmc.broker_or_source
       FROM hertz_posts hp
       LEFT JOIN articles a ON a.id = hp.article_id
       LEFT JOIN users u ON u.id = hp.author_id
       LEFT JOIN hertz_post_market_context pmc ON pmc.post_id = hp.id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS comment_count FROM hertz_comments c
         WHERE c.post_id = hp.id AND c.status = 'visible' AND c.deleted_at IS NULL
       ) cc ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS pulse_count FROM hertz_reactions r
         WHERE r.post_id = hp.id AND r.type = 'pulse' AND r.deleted_at IS NULL
       ) rc ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS repost_count FROM hertz_reposts r
         WHERE r.original_post_id = hp.id AND r.deleted_at IS NULL
       ) rp ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS view_count FROM hertz_views v WHERE v.post_id = hp.id
       ) vc ON true
       LEFT JOIN hertz_reactions vr
         ON vr.post_id = hp.id AND vr.user_id = $${viewerParam}::uuid AND vr.type = 'pulse' AND vr.deleted_at IS NULL
       LEFT JOIN hertz_bookmarks vb
         ON vb.post_id = hp.id AND vb.user_id = $${viewerParam}::uuid AND vb.deleted_at IS NULL
       LEFT JOIN hertz_reposts vrr
         ON vrr.original_post_id = hp.id AND vrr.user_id = $${viewerParam}::uuid AND vrr.repost_type = 'repost' AND vrr.deleted_at IS NULL
       WHERE ${whereSql}
       ORDER BY hp.pinned_at DESC NULLS LAST, hp.created_at DESC, hp.id DESC
       LIMIT $${limitParam}`,
      values,
      client,
    );
    return result.rows;
  }
}
