import { query } from '../db';
import { HertzPostRepository } from '../repositories/hertzPostRepository';
import { stripHtml } from '../utils/textToHtml';

export interface HertzSearchResult {
  type: 'post' | 'member' | 'topic' | 'pair';
  id: string;
  label: string;
  description: string | null;
  href: string;
}

export interface HertzSearchResponse {
  query: string;
  results: HertzSearchResult[];
}

export type HertzSearchType = 'post' | 'member';

export function normalizeHertzSearchQuery(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length >= 2 ? text.slice(0, 80) : null;
}

export function extractHertzTopics(text: string): string[] {
  const matches = text.match(/#[A-Za-z0-9_]+/g) ?? [];
  return Array.from(new Set(matches.map((item) => item.slice(1).toLowerCase())));
}

export function formatHertzSearchPostLabel(contentHtml: string | null | undefined, maxLength = 70): string {
  const spacedHtml = (contentHtml ?? '').replace(/<[^>]*>/g, ' ');
  const cleaned = stripHtml(spacedHtml).replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, maxLength) || 'Postingan HERTZ';
}

export class HertzSearchService {
  private readonly posts = new HertzPostRepository();

  async search(value: unknown, type: HertzSearchType | null = null): Promise<HertzSearchResponse> {
    const text = normalizeHertzSearchQuery(value);
    if (!text) return { query: '', results: [] };

    const like = `%${text.replace(/^#/, '')}%`;
    const [posts, members, pairs, topicRows] = await Promise.all([
      type === 'member' ? Promise.resolve([]) : this.posts.searchPublishedPreview(text.replace(/^#/, ''), 6),
      type === 'post' ? Promise.resolve({ rows: [] }) : query<{ id: string; username: string | null; display_name: string | null }>(
        `SELECT id, username, display_name
         FROM users
         WHERE verified_member_at IS NOT NULL
           AND (username ILIKE $1 OR display_name ILIKE $1)
         ORDER BY display_name ASC NULLS LAST
         LIMIT 5`,
        [like],
      ),
      type ? Promise.resolve({ rows: [] }) : query<{ pair: string }>(
        `SELECT DISTINCT pair
         FROM hertz_post_market_context
         WHERE pair IS NOT NULL AND pair ILIKE $1
         ORDER BY pair ASC
         LIMIT 5`,
        [like],
      ),
      type ? Promise.resolve({ rows: [] }) : query<{ content: string }>(
        `SELECT content
         FROM hertz_posts
         WHERE status = 'published' AND deleted_at IS NULL AND content ILIKE $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [`%#${text.replace(/^#/, '')}%`],
      ),
    ]);

    const topicResults = Array.from(new Set(topicRows.rows.flatMap((row) => extractHertzTopics(row.content))))
      .filter((topic) => topic.includes(text.replace(/^#/, '').toLowerCase()))
      .slice(0, 5)
      .map((topic) => ({
        type: 'topic' as const,
        id: `topic-${topic}`,
        label: `#${topic}`,
        description: 'Topik HERTZ',
        href: `/hertz?q=${encodeURIComponent(`#${topic}`)}`,
      }));

    return {
      query: text,
      results: [
        ...posts.map((post) => ({
          type: 'post' as const,
          id: post.id,
          label: formatHertzSearchPostLabel(post.content_html),
          description: post.author_display_name,
          href: `/hertz/post/${post.short_id}`,
        })),
        ...members.rows.map((member) => ({
          type: 'member' as const,
          id: member.id,
          label: member.display_name ?? member.username ?? 'Member Hertz',
          description: member.username ? `@${member.username}` : 'Member HERTZ',
          href: `/hertz?q=${encodeURIComponent(member.username ?? member.display_name ?? '')}`,
        })),
        ...topicResults,
        ...pairs.rows.map((row) => ({
          type: 'pair' as const,
          id: `pair-${row.pair}`,
          label: row.pair,
          description: 'Pair market',
          href: `/hertz?q=${encodeURIComponent(row.pair)}`,
        })),
      ],
    };
  }
}
