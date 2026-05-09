import { query, queryOne, execute, type DbClient } from '../db';
import type { HertzBlogPostInput } from '../types/hertz';

export class HertzBlogRepository {
  async create(authorId: string, slug: string, input: HertzBlogPostInput, client?: DbClient) {
    return queryOne<{ id: string; slug: string }>(
      `INSERT INTO articles (author_id, title, slug, content_html, category, source, status)
       VALUES ($1, $2, $3, $4, 'blog', 'web', 'published')
       RETURNING id, slug`,
      [authorId, input.title, slug, input.content],
      client,
    );
  }

  async update(articleId: string, input: HertzBlogPostInput, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE articles
       SET title = $2, content_html = $3, updated_at = NOW()
       WHERE id = $1 AND category = 'blog'`,
      [articleId, input.title, input.content],
      client,
    );
  }

  async softDelete(articleId: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE articles SET status = 'hidden', updated_at = NOW()
       WHERE id = $1 AND category = 'blog'`,
      [articleId],
      client,
    );
  }

  async slugExists(slug: string, client?: DbClient): Promise<boolean> {
    const row = await queryOne<{ id: string }>(
      `SELECT id FROM articles WHERE slug = $1 AND category = 'blog'`,
      [slug],
      client,
    );
    return Boolean(row);
  }

  async listPublished(limit = 20, client?: DbClient) {
    const result = await query(
      `SELECT a.*, u.username, u.display_name, u.avatar_url, u.role
       FROM articles a
       LEFT JOIN users u ON u.id = a.author_id
       WHERE a.category = 'blog' AND a.status = 'published'
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit],
      client,
    );
    return result.rows;
  }
}
