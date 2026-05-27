import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('HERTZ mobile brand', () => {
  it('renders the Hertz atom logo in the HERTZ layout shell', () => {
    const source = read('frontend/src/components/layout/HertzLayout.tsx');

    expect(source).toContain('mobileBrand');
    expect(source).toContain('BRAND_LOGO_ATOM_WHITE');
    expect(source).toContain('aria-label="Hertz Home"');
  });

  it('keeps the mobile brand hidden on desktop and visible on mobile', () => {
    const css = read('frontend/src/components/layout/HertzLayout.module.css');

    expect(css).toMatch(/\.mobileBrand\s*\{[^}]*display:\s*none;/s);
    expect(css).toMatch(/@media \(max-width: 1024px\)[\s\S]*\.mobileBrand\s*\{[^}]*display:\s*inline-flex;/s);
  });
});
