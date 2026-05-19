import { query, queryOne } from '../db';

export interface OutlookCardRecord {
  id: string;
  title: string | null;
  content_html: string;
  slug: string;
  created_at: string;
  author_name: string | null;
  cover_image: string | null;
  outlook_metadata: unknown;
  media: Array<{ id: string; file_url: string; media_type: string }>;
}

export interface OutlookDetailRecord extends OutlookCardRecord {
  category: string;
  commentCount: number;
  likeCount: number;
}

function mapCardRow(row: {
  id: string;
  title: string | null;
  content_html: string;
  slug: string;
  created_at: Date;
  author_name: string | null;
  cover_image: string | null;
  video_media: string | null;
  outlook_metadata: unknown;
}): OutlookCardRecord {
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
  return {
    id: row.id,
    title: row.title,
    content_html: row.content_html,
    slug: row.slug,
    created_at: createdAt,
    author_name: row.author_name,
    cover_image: row.cover_image,
    outlook_metadata: row.outlook_metadata,
    media: [
      ...(row.cover_image ? [{ id: `${row.id}-cover`, file_url: row.cover_image, media_type: 'image' }] : []),
      ...(row.video_media ? [{ id: `${row.id}-video`, file_url: row.video_media, media_type: 'video' }] : []),
    ],
  };
}

export class OutlookArticleService {
  async listPublished(): Promise<OutlookCardRecord[]> {
    const result = await query<{
      id: string;
      title: string | null;
      content_html: string;
      slug: string;
      created_at: Date;
      author_name: string | null;
      cover_image: string | null;
      video_media: string | null;
      outlook_metadata: unknown;
    }>(
      `SELECT a.id, a.title, a.content_html, a.slug, a.created_at, a.outlook_metadata,
              u.username AS author_name,
              (SELECT m.file_url FROM media m WHERE m.article_id = a.id AND m.media_type = 'image' ORDER BY m.created_at ASC LIMIT 1) AS cover_image,
              (SELECT m.file_url FROM media m WHERE m.article_id = a.id AND m.media_type = 'video' ORDER BY m.created_at ASC LIMIT 1) AS video_media
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.status = $1 AND a.category = $2
       ORDER BY a.created_at DESC`,
      ['published', 'outlook'],
    );
    return result.rows.map(mapCardRow);
  }

  async getPublishedBySlug(slug: string): Promise<OutlookDetailRecord | null> {
    const article = await queryOne<{
      id: string;
      title: string | null;
      content_html: string;
      category: string;
      slug: string;
      created_at: Date;
      author_name: string | null;
      outlook_metadata: unknown;
    }>(
      `SELECT a.id, a.title, a.content_html, a.category, a.outlook_metadata,
              a.slug, a.created_at, u.username AS author_name
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.slug = $1 AND a.status = $2 AND a.category = $3`,
      [slug, 'published', 'outlook'],
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

    const base = mapCardRow({
      ...article,
      cover_image: mediaResult.rows.find((m) => m.media_type === 'image')?.file_url ?? null,
      video_media: mediaResult.rows.find((m) => m.media_type === 'video')?.file_url ?? null,
    });

    return {
      ...base,
      category: article.category,
      media: mediaResult.rows,
      commentCount: parseInt(commentCountResult?.count || '0', 10),
      likeCount: parseInt(likeCountResult?.count || '0', 10),
    };
  }
}
