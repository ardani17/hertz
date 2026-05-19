import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('Horizon premium forex landing contract', () => {
  it('keeps the root landing dynamic and backed by real GlobalData forex rows', () => {
    const page = read('frontend/src/app/page.tsx');
    const landingData = read('frontend/src/features/marketing/lib/landing-data.ts');

    expect(page).toContain("export const dynamic = 'force-dynamic'");
    expect(page).toContain('getLandingMarketGroups');
    expect(page).toContain('HorizonLandingView');
    expect(landingData).toContain('getMarketRailGroups');
    expect(landingData).toContain('getForexHeroModel');
  });

  it('presents Horizon as a premium market product with HERTZ as the primary action', () => {
    const view = read('frontend/src/features/marketing/HorizonLandingView.tsx');
    const hero = read('frontend/src/features/marketing/sections/LandingHero.tsx');
    const nav = read('frontend/src/features/marketing/sections/LandingNav.tsx');

    expect(view).toContain('LandingHero');
    expect(hero).toContain('href="/hertz"');
    expect(nav).toContain('HERTZ');
    expect(nav).toContain('/outlook');
    expect(nav).toContain('/blog');
    expect(nav).toContain('/tools');
  });

  it('uses premium forex hero styles without falling back to the dashboard command panel', () => {
    const css = read('frontend/src/features/marketing/HorizonLanding.module.css');

    expect(css).toContain('.forexHero');
    expect(css).toContain('.heroChart');
    expect(css).toContain('.mobileDock');
    expect(css).not.toContain('.commandPanel');
  });
});
