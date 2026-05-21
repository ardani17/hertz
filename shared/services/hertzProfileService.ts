import { query } from '../db';

export interface HertzProfileActivityItem {
  id: string;
  shortId: string;
  label: string;
  text: string;
  createdAt: string;
}

export interface HertzProfileActivity {
  posts: HertzProfileActivityItem[];
  saved: HertzProfileActivityItem[];
  reposts: HertzProfileActivityItem[];
  comments: HertzProfileActivityItem[];
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function buildProfileActivityTabs(activity: HertzProfileActivity) {
  return [
    { key: 'posts', label: 'Postingan', count: activity.posts.length },
    { key: 'saved', label: 'Disimpan', count: activity.saved.length },
    { key: 'reposts', label: 'Repost', count: activity.reposts.length },
    { key: 'comments', label: 'Komentar', count: activity.comments.length },
  ];
}

export class HertzProfileService {
  async getActivity(userId: string): Promise<HertzProfileActivity> {
    const [posts, saved, reposts, comments] = await Promise.all([
      query<{ id: string; short_id: string; content: string; created_at: Date }>(
        `SELECT id, short_id, content, created_at
         FROM hertz_posts
         WHERE author_id = $1 AND status = 'published' AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 8`,
        [userId],
      ),
      query<{ id: string; short_id: string; content: string; created_at: Date }>(
        `SELECT hp.id, hp.short_id, hp.content, hb.created_at
         FROM hertz_bookmarks hb
         JOIN hertz_posts hp ON hp.id = hb.post_id
         WHERE hb.user_id = $1 AND hb.deleted_at IS NULL AND hp.status = 'published' AND hp.deleted_at IS NULL
         ORDER BY hb.created_at DESC
         LIMIT 8`,
        [userId],
      ),
      query<{ id: string; short_id: string; content: string; created_at: Date }>(
        `SELECT hp.id, hp.short_id, hp.content, hr.created_at
         FROM hertz_reposts hr
         JOIN hertz_posts hp ON hp.id = hr.original_post_id
         WHERE hr.user_id = $1 AND hr.deleted_at IS NULL AND hp.status = 'published' AND hp.deleted_at IS NULL
         ORDER BY hr.created_at DESC
         LIMIT 8`,
        [userId],
      ),
      query<{ id: string; short_id: string; content: string; created_at: Date }>(
        `SELECT hc.id, hp.short_id, hc.content, hc.created_at
         FROM hertz_comments hc
         JOIN hertz_posts hp ON hp.id = hc.post_id
         WHERE hc.user_id = $1 AND hc.status = 'visible' AND hc.deleted_at IS NULL
         ORDER BY hc.created_at DESC
         LIMIT 8`,
        [userId],
      ),
    ]);

    const mapItem = (label: string) => (row: { id: string; short_id: string; content: string; created_at: Date }) => ({
      id: row.id,
      shortId: row.short_id,
      label,
      text: row.content,
      createdAt: toIso(row.created_at),
    });

    return {
      posts: posts.rows.map(mapItem('Post')),
      saved: saved.rows.map(mapItem('Disimpan')),
      reposts: reposts.rows.map(mapItem('Repost')),
      comments: comments.rows.map(mapItem('Komentar')),
    };
  }
}
