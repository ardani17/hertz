import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('HERTZ Blog removal contract', () => {
  it('keeps Outlook engagement generic without shipping Blog detail pages', () => {
    const engagement = read('frontend/src/components/outlook/OutlookEngagement.tsx');

    expect(engagement).toContain('contentLabel');
    expect(engagement).toContain("contentLabel = 'Outlook'");
    expect(() => read('frontend/src/app/blog/[slug]/page.tsx')).toThrow();
  });
});
