import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

describe('HERTZ implementation wiring', () => {
  it('ships the additive database objects required by the spec', () => {
    const migration = read('db/migrations/009_create_hertz_domain.sql');

    for (const table of [
      'hertz_member_sessions',
      'hertz_membership_checks',
      'hertz_posts',
      'hertz_post_market_context',
      'hertz_reactions',
      'hertz_bookmarks',
      'hertz_reposts',
      'hertz_views',
      'hertz_comments',
      'hertz_community_notes',
      'hertz_community_note_sources',
      'hertz_community_note_ratings',
      'hertz_reports',
      'hertz_conversations',
      'hertz_messages',
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it('exposes the member auth and feed API route surface', () => {
    for (const path of [
      'frontend/src/app/api/auth/telegram/route.ts',
      'frontend/src/app/api/auth/me/route.ts',
      'frontend/src/app/api/hertz/posts/route.ts',
      'frontend/src/app/api/hertz/posts/[shortId]/route.ts',
      'frontend/src/app/api/hertz/posts/[shortId]/pulse/route.ts',
      'frontend/src/app/api/hertz/posts/[shortId]/bookmark/route.ts',
      'frontend/src/app/api/hertz/posts/[shortId]/repost/route.ts',
      'frontend/src/app/api/hertz/posts/[shortId]/comments/route.ts',
      'frontend/src/app/api/hertz/posts/[shortId]/community-notes/route.ts',
      'frontend/src/app/api/hertz/posts/community-notes/[noteId]/rating/route.ts',
    ]) {
      expect(existsSync(join(root, path))).toBe(true);
    }
  });

  it('keeps guest mutations behind member auth checks', () => {
    const routes = [
      read('frontend/src/app/api/hertz/posts/[shortId]/pulse/route.ts'),
      read('frontend/src/app/api/hertz/posts/[shortId]/bookmark/route.ts'),
      read('frontend/src/app/api/hertz/posts/[shortId]/repost/route.ts'),
      read('frontend/src/app/api/hertz/posts/[shortId]/comments/route.ts'),
      read('frontend/src/app/api/hertz/posts/[shortId]/community-notes/route.ts'),
    ];

    for (const route of routes) {
      expect(route).toContain('getCurrentMember');
      expect(route).toContain('apiError');
      expect(route).toContain('Login');
    }
  });

  it('wires Telegram article creation and publish into feed_posts', () => {
    const bot = read('bot/src/index.ts');

    expect(bot).toContain('INSERT INTO feed_posts');
    expect(bot).toContain('pending_review');
    expect(bot).toContain('UPDATE feed_posts');
    expect(bot).toContain('article_id = $2');
  });

  it('keeps Blog and Outlook separate from HERTZ feed routes', () => {
    const home = read('frontend/src/app/page.tsx');
    const blog = existsSync(join(root, 'frontend/src/app/blog/page.tsx'));
    const outlook = existsSync(join(root, 'frontend/src/app/outlook/page.tsx'));

    expect(home).toContain('HERTZ');
    expect(blog).toBe(true);
    expect(outlook).toBe(true);
  });
});
