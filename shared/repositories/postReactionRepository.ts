import { execute, queryOne, type DbClient } from '../db';

export class PostReactionRepository {
  async hasPulse(postId: string, userId: string, client?: DbClient): Promise<boolean> {
    const row = await queryOne<{ id: string }>(
      `SELECT id FROM post_reactions
       WHERE post_id = $1 AND user_id = $2 AND reaction_type = 'pulse' AND deleted_at IS NULL`,
      [postId, userId],
      client,
    );
    return Boolean(row);
  }

  async togglePulse(postId: string, userId: string, client?: DbClient): Promise<{ active: boolean }> {
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM post_reactions
       WHERE post_id = $1 AND user_id = $2 AND reaction_type = 'pulse' AND deleted_at IS NULL`,
      [postId, userId],
      client,
    );

    if (existing) {
      await execute(
        'UPDATE post_reactions SET deleted_at = NOW() WHERE id = $1',
        [existing.id],
        client,
      );
      return { active: false };
    }

    await execute(
      `INSERT INTO post_reactions (post_id, user_id, reaction_type)
       VALUES ($1, $2, 'pulse')
       ON CONFLICT DO NOTHING`,
      [postId, userId],
      client,
    );
    return { active: true };
  }

  async hasSignal(postId: string, userId: string, client?: DbClient): Promise<boolean> {
    return this.hasPulse(postId, userId, client);
  }

  async toggleSignal(postId: string, userId: string, client?: DbClient): Promise<{ active: boolean }> {
    return this.togglePulse(postId, userId, client);
  }
}
