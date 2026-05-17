import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('Horizon premium forex landing contract', () => {
  it('keeps the root landing dynamic and backed by real GlobalData forex rows', () => {
    const source = read('frontend/src/app/page.tsx');

    expect(source).toContain("export const dynamic = 'force-dynamic'");
    expect(source).toContain('getMarketRailGroups');
    expect(source).toContain('getForexHeroModel');
    expect(source).toContain("group.title === 'Forex Market'");
    expect(source).toContain("row.symbol === 'XAUUSD'");
    expect(source).toContain('buildSparklinePath');
    expect(source).not.toContain('M2 40 26 28 48 33');
  });

  it('presents Horizon as a premium market product with HERTZ as the primary action', () => {
    const source = read('frontend/src/app/page.tsx');

    expect(source).toContain('Horizon Market Intelligence');
    expect(source).toContain('Buka HERTZ');
    expect(source).toContain('Lihat Outlook');
    expect(source).toContain('/hertz');
    expect(source).toContain('/outlook');
    expect(source).toContain('/blog');
    expect(source).toContain('/tools');
  });

  it('uses premium forex hero styles without falling back to the dashboard command panel', () => {
    const css = read('frontend/src/app/HorizonLanding.module.css');

    expect(css).toContain('.forexHero');
    expect(css).toContain('.heroChart');
    expect(css).toContain('.forexStrip');
    expect(css).toContain('.marketShowcase');
    expect(css).toContain('.mobileDock');
    expect(css).not.toContain('.commandPanel');
    expect(css).not.toContain('letter-spacing: -');
  });
});
