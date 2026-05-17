import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('Horizon landing command center contract', () => {
  it('keeps the root landing as a dynamic Horizon command center', () => {
    const source = read('frontend/src/app/page.tsx');

    expect(source).toContain("export const dynamic = 'force-dynamic'");
    expect(source).toContain('HertzPostService');
    expect(source).toContain('getMarketRailGroups');
    expect(source).toContain('commandPanel');
    expect(source).toContain('Buka HERTZ');
    expect(source).toContain('Horizon Command Center');
  });

  it('keeps the page connected to the full Horizon ecosystem', () => {
    const source = read('frontend/src/app/page.tsx');

    expect(source).toContain('/hertz');
    expect(source).toContain('/outlook');
    expect(source).toContain('/blog');
    expect(source).toContain('/tools');
    expect(source).toContain('Outlook');
    expect(source).toContain('Blog');
    expect(source).toContain('Tools');
  });

  it('uses HERTZ-like responsive landing styles', () => {
    const css = read('frontend/src/app/HorizonLanding.module.css');

    expect(css).toContain('.commandPanel');
    expect(css).toContain('.mobileDock');
    expect(css).toContain('border-radius: 8px');
    expect(css).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(css).toContain('@media (max-width: 760px)');
    expect(css).not.toContain('letter-spacing: -');
  });
});
