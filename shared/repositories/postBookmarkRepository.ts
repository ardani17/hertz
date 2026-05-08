import { execute, queryOne, type DbClient } from '../db';

export class PostBookmarkRepository {
  async toggleBookmark(postId: string, userId: string, client?: DbClient): Promise<{ active: boolean }> {
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM post_bookmarks
       WHERE post_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [postId, userId],
      client,
    );

    if (existing) {
      await execute('UPDATE post_bookmarks SET deleted_at = NOW() WHERE id = $1', [existing.id], client);
      return { active: false };
    }

    await execute(
      `INSERT INTO post_bookmarks (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [postId, userId],
      client,
    );
    return { active: true };
  }
}
