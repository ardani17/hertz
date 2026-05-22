import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Feature: horizon-social-ux-uplift, Smoke: horizon design tokens

describe('horizon visual identity tokens', () => {
  it('defines locked base and accent tokens', () => {
    const css = readFileSync('frontend/src/app/globals.css', 'utf8');
    expect(css).toContain('--horizon-bg-base: #0a0a0f');
    expect(css).toContain('--horizon-accent: #13d27b');
  });
});
