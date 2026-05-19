import { query, queryOne } from '../db';

export interface LegacyArticleDetail {
  id: string;
  title: string | null;
  content_html: string;
  category: string;
  slug: string;
  created_at: string;
  author_name: string | null;
  media: Array<{ id: string; file_url: string; media_type: string }>;
  commentCount: number;
  likeCount: number;
}

export class LegacyArticleService {
  async getPublishedBySlug(slug: string): Promise<LegacyArticleDetail | null> {
    const article = await queryOne<{
      id: string;
      title: string | null;
      content_html: string;
      category: string;
      slug: string;
      created_at: Date;
      author_name: string | null;
    }>(
      `SELECT a.id, a.title, a.content_html, a.category,
              a.slug, a.created_at, u.username AS author_name
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.slug = $1 AND a.status = $2`,
      [slug, 'published'],
    );

    if (!article) return null;

    const [mediaResult, commentCountResult, likeCountResult] = await Promise.all([
      query<{ id: string; file_url: string; media_type: string }>(
        `SELECT id, file_url, media_type FROM media WHERE article_id = $1 ORDER BY created_at ASC`,
        [article.id],
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM comments WHERE article_id = $1 AND status = $2`,
        [article.id, 'visible'],
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM likes WHERE article_id = $1`,
        [article.id],
      ),
    ]);

    return {
      id: article.id,
      title: article.title,
      content_html: article.content_html,
      category: article.category,
      slug: article.slug,
      created_at: article.created_at instanceof Date ? article.created_at.toISOString() : String(article.created_at),
      author_name: article.author_name,
      media: mediaResult.rows,
      commentCount: parseInt(commentCountResult?.count || '0', 10),
      likeCount: parseInt(likeCountResult?.count || '0', 10),
    };
  }
}
