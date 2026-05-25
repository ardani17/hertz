import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Feature: horizon-social-ux-uplift, Smoke: force-dynamic public pages

describe('public pages ISR policy', () => {
  it('does not force dynamic rendering on public pages', () => {
    const pages = [
      'frontend/src/app/page.tsx',
      'frontend/src/app/outlook/page.tsx',
      'frontend/src/app/outlook/[slug]/page.tsx',
      'frontend/src/app/gallery/page.tsx',
    ];
    for (const file of pages) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toContain("dynamic = 'force-dynamic'");
      expect(source).not.toContain('dynamic = "force-dynamic"');
    }
  });
});
