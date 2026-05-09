import { query, queryOne, execute, type DbClient } from '../db';
import type { HertzBlogPostInput } from '../types/hertz';

export class HertzBlogRepository {
  async create(authorId: string, slug: string, input: HertzBlogPostInput, client?: DbClient) {
    const article = await queryOne<{ id: string; slug: string }>(
      `INSERT INTO articles (author_id, title, slug, content_html, category, source, status)
       VALUES ($1, $2, $3, $4, 'blog', 'web', 'published')
       RETURNING id, slug`,
      [authorId, input.title, slug, input.content],
      client,
    );
    if (article && input.coverImageUrl) {
      await this.upsertCover(article.id, input.coverImageUrl, client);
    }
    return article;
  }

  async update(articleId: string, input: HertzBlogPostInput, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE articles
       SET title = $2, content_html = $3, updated_at = NOW()
       WHERE id = $1 AND category = 'blog'`,
      [articleId, input.title, input.content],
      client,
    );
    if (input.coverImageUrl) await this.upsertCover(articleId, input.coverImageUrl, client);
  }

  async findManageable(articleId: string, client?: DbClient) {
    return queryOne<{ id: string; author_id: string; status: string }>(
      `SELECT id, author_id, status FROM articles WHERE id = $1 AND category = 'blog'`,
      [articleId],
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

  private async upsertCover(articleId: string, url: string, client?: DbClient): Promise<void> {
    await execute(
      `INSERT INTO media (article_id, file_url, media_type, file_key, file_size)
       VALUES ($1, $2, 'image', $2, 0)`,
      [articleId, url],
      client,
    );
  }
}
