import { execute, query, queryOne, type DbClient } from '../db';

export interface HertzCommentRow {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  status: 'visible' | 'hidden' | 'deleted';
  edited_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: 'member' | 'admin';
}

export class HertzCommentRepository {
  async listByPost(postId: string, client?: DbClient): Promise<HertzCommentRow[]> {
    const result = await query<HertzCommentRow>(
      `SELECT c.*, u.username, u.display_name, u.avatar_url, u.role
       FROM hertz_comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1 AND c.status = 'visible' AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
      [postId],
      client,
    );
    return result.rows;
  }

  async create(postId: string, userId: string, content: string, client?: DbClient): Promise<HertzCommentRow> {
    const row = await queryOne<HertzCommentRow>(
      `INSERT INTO hertz_comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *, NULL::text AS username, NULL::text AS display_name,
                 NULL::text AS avatar_url, 'member'::text AS role`,
      [postId, userId, content],
      client,
    );
    if (!row) throw new Error('Failed to create HERTZ comment');
    return row;
  }

  async findById(commentId: string, client?: DbClient): Promise<HertzCommentRow | null> {
    return queryOne<HertzCommentRow>(
      `SELECT c.*, u.username, u.display_name, u.avatar_url, u.role
       FROM hertz_comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = $1`,
      [commentId],
      client,
    );
  }

  async updateContent(commentId: string, content: string, client?: DbClient): Promise<void> {
    await execute(
      'UPDATE hertz_comments SET content = $1, edited_at = NOW(), updated_at = NOW() WHERE id = $2',
      [content, commentId],
      client,
    );
  }

  async softDelete(commentId: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE hertz_comments SET status = 'deleted', deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [commentId],
      client,
    );
  }

  async hide(commentId: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE hertz_comments SET status = 'hidden', updated_at = NOW() WHERE id = $1`,
      [commentId],
      client,
    );
  }
}
