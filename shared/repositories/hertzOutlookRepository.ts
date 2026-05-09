import { query, type DbClient } from '../db';

export class HertzOutlookRepository {
  async listPublished(limit = 20, client?: DbClient) {
    const result = await query(
      `SELECT a.*, u.username, u.display_name, u.avatar_url, u.role
       FROM articles a
       LEFT JOIN users u ON u.id = a.author_id
       WHERE a.category = 'outlook' AND a.status = 'published'
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit],
      client,
    );
    return result.rows;
  }
}
