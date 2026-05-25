import { query, queryOne } from '@shared/db';
import { stripHtml } from '@shared/utils/textToHtml';
import {
  buildOutlookSnapshot,
  getOutlookSummary,
  inferOutlookContentKind,
  normalizeOutlookMetadata,
  type OutlookMediaInput,
} from './outlookContent';

interface ArticleRow {
  id: string;
  title: string | null;
  content_html: string;
  slug: string;
  source: string;
  category: string;
  created_at: Date;
  updated_at: Date;
  author_id: string;
  author_username: string | null;
  author_display_name: string | null;
  author_avatar_url: string | null;
  cover_image: string | null;
  outlook_metadata: unknown;
  comment_count: string;
  like_count: string;
}

interface MediaRow {
  id: string;
  file_url: string;
  media_type: 'image' | 'video';
  created_at: Date;
  article_title: string | null;
  article_slug: string | null;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function clampLimit(value: string | null | undefined, fallback = 20, max = 50): number {
  const limit = Number(value ?? fallback);
  if (!Number.isFinite(limit)) return fallback;
  return Math.min(Math.max(Math.trunc(limit), 1), max);
}

function clampOffset(value: string | null | undefined): number {
  const offset = Number(value ?? 0);
  if (!Number.isFinite(offset)) return 0;
  return Math.max(Math.trunc(offset), 0);
}

function toOutlookMedia(media: OutlookMediaInput[], coverImage: string | null): OutlookMediaInput[] {
  if (media.length > 0) return media;
  return coverImage ? [{ id: 'cover', file_url: coverImage, media_type: 'image' }] : [];
}

function buildMobileOutlook(row: ArticleRow, media: OutlookMediaInput[]) {
  if (row.category !== 'outlook') return undefined;
  const metadata = normalizeOutlookMetadata(row.outlook_metadata);
  const outlookMedia = toOutlookMedia(media, row.cover_image);
  return {
    kind: inferOutlookContentKind({
      metadata,
      media: outlookMedia,
      contentHtml: row.content_html,
    }),
    summary: getOutlookSummary({ metadata, contentHtml: row.content_html }),
    snapshot: buildOutlookSnapshot(metadata),
    keyPoints: Array.isArray(metadata.keyPoints) ? metadata.keyPoints : [],
  };
}

function mapArticle(row: ArticleRow, includeContent = false, media: OutlookMediaInput[] = []) {
  const text = stripHtml(row.content_html);
  const article = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    source: row.source,
    category: row.category,
    excerpt: text.length > 220 ? `${text.slice(0, 220).trim()}...` : text,
    contentHtml: includeContent ? row.content_html : undefined,
    coverImage: row.cover_image ? {
      thumbnailUrl: row.cover_image,
      fullUrl: row.cover_image,
    } : null,
    author: {
      id: row.author_id,
      username: row.author_username,
      displayName: row.author_display_name ?? row.author_username ?? 'Hertz',
      avatarUrl: row.author_avatar_url,
    },
    counts: {
      comments: Number(row.comment_count ?? 0),
      likes: Number(row.like_count ?? 0),
    },
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
  const outlook = buildMobileOutlook(row, media);
  return outlook ? { ...article, outlook } : article;
}

export async function listMobileArticles(params: {
  category: 'outlook';
  source?: string | null;
  limit?: string | null;
  offset?: string | null;
  search?: string | null;
}) {
  const limit = clampLimit(params.limit);
  const offset = clampOffset(params.offset);
  const values: unknown[] = ['published', params.category];
  let where = 'WHERE a.status = $1 AND a.category = $2';
  if (params.source) {
    values.push(params.source);
    where += ` AND a.source = $${values.length}`;
  }
  if (params.search?.trim()) {
    values.push(`%${params.search.trim()}%`);
    where += ` AND (a.title ILIKE $${values.length} OR a.content_html ILIKE $${values.length})`;
  }

  const result = await query<ArticleRow>(
    `SELECT a.id, a.title, a.content_html, a.slug, a.source, a.category, a.created_at, a.created_at AS updated_at,
            a.outlook_metadata,
            a.author_id,
            u.username AS author_username,
            u.display_name AS author_display_name,
            u.avatar_url AS author_avatar_url,
            (SELECT m.file_url FROM media m WHERE m.article_id = a.id AND m.media_type = 'image' ORDER BY m.created_at ASC LIMIT 1) AS cover_image,
            (SELECT COUNT(*)::text FROM comments c WHERE c.article_id = a.id AND c.status = 'visible') AS comment_count,
            (SELECT COUNT(*)::text FROM likes l WHERE l.article_id = a.id) AS like_count
     FROM articles a
     LEFT JOIN users u ON u.id = a.author_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit + 1, offset],
  );

  const rows = result.rows.slice(0, limit);
  return {
    items: rows.map((row) => mapArticle(row)),
    nextOffset: result.rows.length > limit ? offset + limit : null,
  };
}

export async function getMobileArticle(params: {
  category: 'outlook';
  source?: string | null;
  slug: string;
}) {
  const values: unknown[] = [params.slug, 'published', params.category];
  let sourceClause = '';
  if (params.source) {
    values.push(params.source);
    sourceClause = ` AND a.source = $${values.length}`;
  }
  const row = await queryOne<ArticleRow>(
    `SELECT a.id, a.title, a.content_html, a.slug, a.source, a.category, a.created_at, a.created_at AS updated_at,
            a.outlook_metadata,
            a.author_id,
            u.username AS author_username,
            u.display_name AS author_display_name,
            u.avatar_url AS author_avatar_url,
            (SELECT m.file_url FROM media m WHERE m.article_id = a.id AND m.media_type = 'image' ORDER BY m.created_at ASC LIMIT 1) AS cover_image,
            (SELECT COUNT(*)::text FROM comments c WHERE c.article_id = a.id AND c.status = 'visible') AS comment_count,
            (SELECT COUNT(*)::text FROM likes l WHERE l.article_id = a.id) AS like_count
     FROM articles a
     LEFT JOIN users u ON u.id = a.author_id
     WHERE a.slug = $1 AND a.status = $2 AND a.category = $3${sourceClause}`,
    values,
  );
  if (!row) return null;
  const media = await query<MediaRow>(
    `SELECT id, file_url, media_type, created_at, NULL::text AS article_title, NULL::text AS article_slug
     FROM media
     WHERE article_id = $1
     ORDER BY created_at ASC`,
    [row.id],
  );
  return {
    article: mapArticle(row, true, media.rows.map((item) => ({
      id: item.id,
      file_url: item.file_url,
      media_type: item.media_type,
    }))),
    media: media.rows.map(mapMedia),
  };
}

function mapMedia(row: MediaRow) {
  return {
    id: row.id,
    type: row.media_type,
    thumbnailUrl: row.file_url,
    fullUrl: row.file_url,
    createdAt: toIso(row.created_at),
    article: row.article_slug ? {
      slug: row.article_slug,
      title: row.article_title,
    } : null,
  };
}

export async function listMobileGallery(params: { limit?: string | null; offset?: string | null }) {
  const limit = clampLimit(params.limit, 18);
  const offset = clampOffset(params.offset);
  const result = await query<MediaRow>(
    `SELECT m.id, m.file_url, m.media_type, m.created_at,
            a.title AS article_title, a.slug AS article_slug
     FROM media m
     LEFT JOIN articles a ON a.id = m.article_id AND a.status = 'published'
     ORDER BY m.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit + 1, offset],
  );
  return {
    items: result.rows.slice(0, limit).map(mapMedia),
    nextOffset: result.rows.length > limit ? offset + limit : null,
  };
}
