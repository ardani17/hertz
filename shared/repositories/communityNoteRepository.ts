import { execute, query, queryOne, type DbClient } from '../db';
import type { CommunityNoteRatingValue, CommunityNoteSourceInput } from '../types/communityNote';

export interface CommunityNoteRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  status: 'published' | 'hidden' | 'deleted';
  helpful_count: number;
  not_helpful_count: number;
  edited_at: Date | null;
  hidden_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  username: string | null;
  display_name: string | null;
  rating: CommunityNoteRatingValue | null;
}

export interface CommunityNoteSourceRow {
  id: string;
  note_id: string;
  source_url: string;
  source_title: string | null;
  created_at: Date;
}

export class CommunityNoteRepository {
  async listByPost(postId: string, viewerId?: string | null, client?: DbClient): Promise<CommunityNoteRow[]> {
    const result = await query<CommunityNoteRow>(
      `SELECT n.*, u.username, u.display_name, r.rating
       FROM community_notes n
       LEFT JOIN users u ON u.id = n.author_id
       LEFT JOIN community_note_ratings r ON r.note_id = n.id AND r.user_id = $2::uuid
       WHERE n.post_id = $1 AND n.status = 'published' AND n.deleted_at IS NULL
       ORDER BY (n.helpful_count - n.not_helpful_count) DESC, n.created_at DESC`,
      [postId, viewerId ?? null],
      client,
    );
    return result.rows;
  }

  async listPrimaryForPosts(postIds: string[], viewerId?: string | null, client?: DbClient): Promise<CommunityNoteRow[]> {
    if (postIds.length === 0) return [];
    const result = await query<CommunityNoteRow>(
      `SELECT DISTINCT ON (n.post_id) n.*, u.username, u.display_name, r.rating
       FROM community_notes n
       LEFT JOIN users u ON u.id = n.author_id
       LEFT JOIN community_note_ratings r ON r.note_id = n.id AND r.user_id = $2::uuid
       WHERE n.post_id = ANY($1::uuid[]) AND n.status = 'published' AND n.deleted_at IS NULL
       ORDER BY n.post_id, (n.helpful_count - n.not_helpful_count) DESC, n.created_at DESC`,
      [postIds, viewerId ?? null],
      client,
    );
    return result.rows;
  }

  async listSources(noteIds: string[], client?: DbClient): Promise<CommunityNoteSourceRow[]> {
    if (noteIds.length === 0) return [];
    const result = await query<CommunityNoteSourceRow>(
      `SELECT * FROM community_note_sources WHERE note_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
      [noteIds],
      client,
    );
    return result.rows;
  }

  async create(postId: string, authorId: string, content: string, sources: CommunityNoteSourceInput[], client?: DbClient): Promise<CommunityNoteRow> {
    const note = await queryOne<CommunityNoteRow>(
      `INSERT INTO community_notes (post_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING *, NULL::text AS username, NULL::text AS display_name, NULL::text AS rating`,
      [postId, authorId, content],
      client,
    );
    if (!note) throw new Error('Failed to create community note');

    for (const source of sources) {
      await execute(
        `INSERT INTO community_note_sources (note_id, source_url, source_title)
         VALUES ($1, $2, $3)`,
        [note.id, source.url, source.title ?? null],
        client,
      );
    }

    return note;
  }

  async findById(noteId: string, client?: DbClient): Promise<CommunityNoteRow | null> {
    return queryOne<CommunityNoteRow>(
      `SELECT n.*, u.username, u.display_name, NULL::text AS rating
       FROM community_notes n
       LEFT JOIN users u ON u.id = n.author_id
       WHERE n.id = $1`,
      [noteId],
      client,
    );
  }

  async updateContent(noteId: string, content: string, client?: DbClient): Promise<void> {
    await execute(
      'UPDATE community_notes SET content = $1, edited_at = NOW(), updated_at = NOW() WHERE id = $2',
      [content, noteId],
      client,
    );
  }

  async softDelete(noteId: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE community_notes SET status = 'deleted', deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [noteId],
      client,
    );
  }

  async hide(noteId: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE community_notes SET status = 'hidden', hidden_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [noteId],
      client,
    );
  }

  async setRating(noteId: string, userId: string, rating: CommunityNoteRatingValue, client?: DbClient): Promise<void> {
    const existing = await queryOne<{ rating: CommunityNoteRatingValue }>(
      'SELECT rating FROM community_note_ratings WHERE note_id = $1 AND user_id = $2',
      [noteId, userId],
      client,
    );

    if (!existing) {
      await execute(
        `INSERT INTO community_note_ratings (note_id, user_id, rating)
         VALUES ($1, $2, $3)`,
        [noteId, userId, rating],
        client,
      );
    } else {
      await execute(
        `UPDATE community_note_ratings SET rating = $3, updated_at = NOW()
         WHERE note_id = $1 AND user_id = $2`,
        [noteId, userId, rating],
        client,
      );
    }

    await execute(
      `UPDATE community_notes SET
         helpful_count = (
           SELECT COUNT(*) FROM community_note_ratings
           WHERE note_id = $1 AND rating = 'helpful'
         ),
         not_helpful_count = (
           SELECT COUNT(*) FROM community_note_ratings
           WHERE note_id = $1 AND rating = 'not_helpful'
         ),
         updated_at = NOW()
       WHERE id = $1`,
      [noteId],
      client,
    );
  }
}
