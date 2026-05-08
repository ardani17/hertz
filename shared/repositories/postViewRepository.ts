import { execute, queryOne, type DbClient } from '../db';

export class PostViewRepository {
  async recordView(params: {
    postId: string;
    userId?: string | null;
    sessionHash?: string | null;
    ipHash?: string | null;
    userAgentHash?: string | null;
    dedupeHours: number;
  }, client?: DbClient): Promise<{ recorded: boolean }> {
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM post_views
       WHERE post_id = $1
         AND viewed_at > NOW() - ($5::text)::interval
         AND (
           ($2::uuid IS NOT NULL AND user_id = $2::uuid)
           OR ($3::text IS NOT NULL AND session_hash = $3::text)
           OR ($4::text IS NOT NULL AND ip_hash = $4::text)
         )
       LIMIT 1`,
      [
        params.postId,
        params.userId ?? null,
        params.sessionHash ?? null,
        params.ipHash ?? null,
        `${params.dedupeHours} hours`,
      ],
      client,
    );

    if (existing) return { recorded: false };

    await execute(
      `INSERT INTO post_views (post_id, user_id, session_hash, ip_hash, user_agent_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.postId,
        params.userId ?? null,
        params.sessionHash ?? null,
        params.ipHash ?? null,
        params.userAgentHash ?? null,
      ],
      client,
    );
    return { recorded: true };
  }
}
