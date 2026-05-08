import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

describe('Signal Ledger implementation wiring', () => {
  it('ships the additive database objects required by the spec', () => {
    const migration = read('db/migrations/008_create_signal_ledger.sql');

    for (const table of [
      'member_sessions',
      'telegram_memberships',
      'feed_posts',
      'post_market_context',
      'post_reactions',
      'post_bookmarks',
      'post_reposts',
      'post_views',
      'post_comments',
      'community_notes',
      'community_note_sources',
      'community_note_ratings',
      'post_reports',
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it('exposes the member auth and feed API route surface', () => {
    for (const path of [
      'frontend/src/app/api/auth/telegram/route.ts',
      'frontend/src/app/api/auth/me/route.ts',
      'frontend/src/app/api/feed/route.ts',
      'frontend/src/app/api/feed/[postId]/route.ts',
      'frontend/src/app/api/feed/[postId]/signal/route.ts',
      'frontend/src/app/api/feed/[postId]/bookmark/route.ts',
      'frontend/src/app/api/feed/[postId]/repost/route.ts',
      'frontend/src/app/api/feed/[postId]/comments/route.ts',
      'frontend/src/app/api/feed/[postId]/community-notes/route.ts',
      'frontend/src/app/api/feed/community-notes/[noteId]/rating/route.ts',
    ]) {
      expect(existsSync(join(root, path))).toBe(true);
    }
  });

  it('keeps guest mutations behind member auth checks', () => {
    const routes = [
      read('frontend/src/app/api/feed/[postId]/signal/route.ts'),
      read('frontend/src/app/api/feed/[postId]/bookmark/route.ts'),
      read('frontend/src/app/api/feed/[postId]/repost/route.ts'),
      read('frontend/src/app/api/feed/[postId]/comments/route.ts'),
      read('frontend/src/app/api/feed/[postId]/community-notes/route.ts'),
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

  it('keeps Blog and Outlook separate from Signal Ledger feed routes', () => {
    const home = read('frontend/src/app/page.tsx');
    const blog = existsSync(join(root, 'frontend/src/app/blog/page.tsx'));
    const outlook = existsSync(join(root, 'frontend/src/app/outlook/page.tsx'));

    expect(home).toContain('SIGNAL_LEDGER_ENABLED');
    expect(blog).toBe(true);
    expect(outlook).toBe(true);
  });
});
