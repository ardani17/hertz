import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

// Feature: horizon-social-ux-uplift, Smoke: image discipline

describe('raw image discipline', () => {
  it('raw img tags include lazy loading and async decoding outside explicit framework exceptions', () => {
    const files = globSync('frontend/src/**/*.{tsx,jsx}', { ignore: ['frontend/src/**/*.test.tsx', 'frontend/src/**/*.test.jsx'] });
    const violations: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const tags = source.match(/<img\b[^>]*>/g) ?? [];
      for (const tag of tags) {
        if (!tag.includes('loading="lazy"') || !tag.includes('decoding="async"')) violations.push(`${file}: ${tag}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
