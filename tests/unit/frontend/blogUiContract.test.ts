import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('Blog UI contract', () => {
  it('allows OutlookEngagement to be reused by Blog without hard-coded Outlook action copy', () => {
    const source = read('frontend/src/components/outlook/OutlookEngagement.tsx');

    expect(source).toContain('contentLabel');
    expect(source).toContain("contentLabel = 'Outlook'");
    expect(source).toContain('Login Telegram member untuk menyukai');
  });

  it('uses HERTZ-style engagement on Blog detail instead of legacy article actions', () => {
    const source = read('frontend/src/app/blog/[slug]/page.tsx');

    expect(source).toContain('OutlookEngagement');
    expect(source).toContain('contentLabel="Blog"');
    expect(source).not.toContain('ShareButtons');
    expect(source).not.toContain('CommentSection');
    expect(source).not.toContain('LikeButton');
  });
});
