import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Feature: hertz-social-ux-uplift, Smoke: hertz design tokens

describe('hertz visual identity tokens', () => {
  it('defines locked base and accent tokens', () => {
    const css = readFileSync('frontend/src/app/globals.css', 'utf8');
    expect(css).toContain('--hertz-bg-base: #0a0a0f');
    expect(css).toContain('--hertz-accent: #13d27b');
  });
});
