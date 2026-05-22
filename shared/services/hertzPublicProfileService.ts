import { query, queryOne } from '../db';
import type { MemberSessionUser } from '../types/membership';

export type PublicProfilePostPreview = {
  shortId: string;
  excerpt: string;
  createdAt: string;
};

export type PublicProfileDto = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  publicCounters: { posts: number; pulses: number; repostsReceived: number };
  joinedAt: string;
  isSelf: boolean;
  hasExistingDm: boolean;
  recentPosts: PublicProfilePostPreview[];
};

export class HertzPublicProfileService {
  async getPublicProfileByUsername(username: string, viewer: MemberSessionUser | null): Promise<PublicProfileDto | null> {
    const normalized = username.trim().toLowerCase();
    const row = await queryOne<{
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      created_at: Date;
    }>(
      `SELECT id, username, display_name, avatar_url, created_at
       FROM users
       WHERE LOWER(username) = $1 AND verified_member_at IS NOT NULL
       LIMIT 1`,
      [normalized],
    );
    if (!row) return null;

    const countersRow = await queryOne<{ posts: string; pulses: string; reposts_received: string }>(
      `SELECT
         (SELECT COUNT(*)::text FROM hertz_posts WHERE author_id = $1 AND status = 'published' AND deleted_at IS NULL) AS posts,
         (SELECT COUNT(*)::text FROM hertz_reactions r
            JOIN hertz_posts hp ON hp.id = r.post_id
           WHERE hp.author_id = $1 AND r.type = 'pulse' AND r.deleted_at IS NULL) AS pulses,
         (SELECT COUNT(*)::text FROM hertz_reposts r
            JOIN hertz_posts hp ON hp.id = r.original_post_id
           WHERE hp.author_id = $1 AND r.deleted_at IS NULL) AS reposts_received`,
      [row.id],
    );
    const counters = {
      posts: Number(countersRow?.posts ?? 0),
      pulses: Number(countersRow?.pulses ?? 0),
      repostsReceived: Number(countersRow?.reposts_received ?? 0),
    };
    let hasExistingDm = false;
    if (viewer && viewer.id !== row.id) {
      const directKey = [viewer.id, row.id].sort().join(':');
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM hertz_conversations WHERE direct_key = $1 LIMIT 1`,
        [directKey],
      );
      hasExistingDm = Boolean(existing?.id);
    }

    const recentRows = await query<{
      short_id: string;
      content: string | null;
      created_at: Date;
    }>(
      `SELECT short_id, content, created_at
       FROM hertz_posts
       WHERE author_id = $1 AND status = 'published' AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 12`,
      [row.id],
    );

    const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name ?? row.username,
      avatarUrl: row.avatar_url,
      bio: null,
      publicCounters: counters,
      joinedAt: row.created_at.toISOString(),
      isSelf: viewer?.id === row.id,
      hasExistingDm,
      recentPosts: recentRows.rows.map((post) => {
        const plain = stripHtml(post.content ?? '');
        return {
          shortId: post.short_id,
          excerpt: plain.length > 160 ? `${plain.slice(0, 160).trim()}…` : plain || 'Postingan tanpa teks',
          createdAt: post.created_at.toISOString(),
        };
      }),
    };
  }
}
