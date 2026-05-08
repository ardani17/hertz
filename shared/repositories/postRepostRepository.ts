import { execute, queryOne, type DbClient } from '../db';

export interface PostRepostRow {
  id: string;
  original_post_id: string;
  repost_post_id: string | null;
  user_id: string;
  repost_type: 'repost' | 'quote';
  created_at: Date;
  deleted_at: Date | null;
}

export class PostRepostRepository {
  async togglePlainRepost(originalPostId: string, userId: string, client?: DbClient): Promise<{ active: boolean; repostId: string | null }> {
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM post_reposts
       WHERE original_post_id = $1 AND user_id = $2 AND repost_type = 'repost' AND deleted_at IS NULL`,
      [originalPostId, userId],
      client,
    );

    if (existing) {
      await execute('UPDATE post_reposts SET deleted_at = NOW() WHERE id = $1', [existing.id], client);
      return { active: false, repostId: existing.id };
    }

    const row = await queryOne<{ id: string }>(
      `INSERT INTO post_reposts (original_post_id, user_id, repost_type)
       VALUES ($1, $2, 'repost')
       RETURNING id`,
      [originalPostId, userId],
      client,
    );
    return { active: true, repostId: row?.id ?? null };
  }

  async createQuote(originalPostId: string, userId: string, repostPostId: string, client?: DbClient): Promise<PostRepostRow> {
    const row = await queryOne<PostRepostRow>(
      `INSERT INTO post_reposts (original_post_id, repost_post_id, user_id, repost_type)
       VALUES ($1, $2, $3, 'quote')
       RETURNING *`,
      [originalPostId, repostPostId, userId],
      client,
    );
    if (!row) throw new Error('Failed to create quote repost');
    return row;
  }
}
