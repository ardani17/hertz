import { execute, queryOne, type DbClient } from '../db';

export class HertzReactionRepository {
  async togglePulse(postId: string, userId: string, client?: DbClient): Promise<{ active: boolean }> {
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM hertz_reactions
       WHERE post_id = $1 AND user_id = $2 AND type = 'pulse' AND deleted_at IS NULL`,
      [postId, userId],
      client,
    );
    if (existing) {
      await execute('UPDATE hertz_reactions SET deleted_at = NOW() WHERE id = $1', [existing.id], client);
      return { active: false };
    }
    await execute(
      `INSERT INTO hertz_reactions (post_id, user_id, type)
       VALUES ($1, $2, 'pulse')
       ON CONFLICT DO NOTHING`,
      [postId, userId],
      client,
    );
    return { active: true };
  }
}

export class HertzBookmarkRepository {
  async toggleBookmark(postId: string, userId: string, client?: DbClient): Promise<{ active: boolean }> {
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM hertz_bookmarks
       WHERE post_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [postId, userId],
      client,
    );
    if (existing) {
      await execute('UPDATE hertz_bookmarks SET deleted_at = NOW() WHERE id = $1', [existing.id], client);
      return { active: false };
    }
    await execute(
      `INSERT INTO hertz_bookmarks (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [postId, userId],
      client,
    );
    return { active: true };
  }
}

export class HertzRepostRepository {
  async togglePlainRepost(originalPostId: string, userId: string, client?: DbClient): Promise<{ active: boolean; repostId: string | null }> {
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM hertz_reposts
       WHERE original_post_id = $1 AND user_id = $2 AND repost_type = 'repost' AND deleted_at IS NULL`,
      [originalPostId, userId],
      client,
    );
    if (existing) {
      await execute('UPDATE hertz_reposts SET deleted_at = NOW() WHERE id = $1', [existing.id], client);
      return { active: false, repostId: existing.id };
    }
    const row = await queryOne<{ id: string }>(
      `INSERT INTO hertz_reposts (original_post_id, user_id, repost_type)
       VALUES ($1, $2, 'repost')
       RETURNING id`,
      [originalPostId, userId],
      client,
    );
    return { active: true, repostId: row?.id ?? null };
  }

  async createQuote(originalPostId: string, userId: string, repostPostId: string, client?: DbClient): Promise<void> {
    await execute(
      `INSERT INTO hertz_reposts (original_post_id, repost_post_id, user_id, repost_type)
       VALUES ($1, $2, $3, 'quote')`,
      [originalPostId, repostPostId, userId],
      client,
    );
  }
}

export class HertzViewRepository {
  async recordView(params: {
    postId: string;
    userId?: string | null;
    sessionHash?: string | null;
    ipHash?: string | null;
    userAgentHash?: string | null;
    dedupeHours: number;
  }, client?: DbClient): Promise<{ recorded: boolean }> {
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM hertz_views
       WHERE post_id = $1
         AND viewed_at > NOW() - ($5::text)::interval
         AND (
           ($2::uuid IS NOT NULL AND user_id = $2::uuid)
           OR ($3::text IS NOT NULL AND session_hash = $3::text)
           OR ($4::text IS NOT NULL AND ip_hash = $4::text)
         )
       LIMIT 1`,
      [params.postId, params.userId ?? null, params.sessionHash ?? null, params.ipHash ?? null, `${params.dedupeHours} hours`],
      client,
    );
    if (existing) return { recorded: false };
    await execute(
      `INSERT INTO hertz_views (post_id, user_id, session_hash, ip_hash, user_agent_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.postId, params.userId ?? null, params.sessionHash ?? null, params.ipHash ?? null, params.userAgentHash ?? null],
      client,
    );
    return { recorded: true };
  }
}
