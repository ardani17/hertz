import { query, queryOne } from '../db';
import { PAGINATION } from '../constants';

export interface BlogCardRecord {
  id: string;
  title: string | null;
  content_html: string;
  slug: string;
  created_at: string;
  author_name: string | null;
  cover_image: string | null;
}

export interface BlogDetailRecord extends BlogCardRecord {
  category: string;
  media: Array<{ id: string; file_url: string; media_type: string }>;
  commentCount: number;
  likeCount: number;
}

export class BlogArticleService {
  async listPublished(page: number, search: string): Promise<{ articles: BlogCardRecord[]; total: number }> {
    const pageSize = PAGINATION.BLOG_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    const params: unknown[] = ['published', 'blog', 'wordpress'];
    let whereClause = 'WHERE a.status = $1 AND a.category = $2 AND a.source = $3';
    if (search) {
      whereClause += ' AND (a.title ILIKE $4 OR a.content_html ILIKE $4)';
      params.push(`%${search}%`);
    }

    const [articlesResult, countResult] = await Promise.all([
      query<{
        id: string;
        title: string | null;
        content_html: string;
        slug: string;
        created_at: Date;
        author_name: string | null;
        cover_image: string | null;
      }>(
        `SELECT a.id, a.title, a.content_html, a.slug, a.created_at,
                u.username AS author_name,
                (SELECT m.file_url FROM media m WHERE m.article_id = a.id AND m.media_type = 'image' ORDER BY m.created_at ASC LIMIT 1) AS cover_image
         FROM articles a
         LEFT JOIN users u ON a.author_id = u.id
         ${whereClause}
         ORDER BY a.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset],
      ),
      query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM articles a ${whereClause}`, params),
    ]);

    return {
      articles: articlesResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        content_html: row.content_html,
        slug: row.slug,
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        author_name: row.author_name,
        cover_image: row.cover_image,
      })),
      total: parseInt(countResult.rows[0]?.count || '0', 10),
    };
  }

  async getPublishedBySlug(slug: string): Promise<BlogDetailRecord | null> {
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
       WHERE a.slug = $1 AND a.status = $2 AND a.category = $3 AND a.source = $4`,
      [slug, 'published', 'blog', 'wordpress'],
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
      slug: article.slug,
      category: article.category,
      created_at:
        article.created_at instanceof Date ? article.created_at.toISOString() : String(article.created_at),
      author_name: article.author_name,
      cover_image: mediaResult.rows.find((m) => m.media_type === 'image')?.file_url ?? null,
      media: mediaResult.rows,
      commentCount: parseInt(commentCountResult?.count || '0', 10),
      likeCount: parseInt(likeCountResult?.count || '0', 10),
    };
  }
}
