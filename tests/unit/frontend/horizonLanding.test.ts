import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('HERTZ root contract', () => {
  it('redirects the root route to the HERTZ feed', () => {
    const page = read('frontend/src/app/page.tsx');

    expect(page).toContain("redirect('/hertz')");
    expect(page).not.toContain('HorizonLandingView');
  });

  it('does not ship Horizon landing or Blog pages', () => {
    expect(existsSync(resolve(rootDir, 'frontend/src/features/marketing/HorizonLandingView.tsx'))).toBe(false);
    expect(existsSync(resolve(rootDir, 'frontend/src/app/blog/page.tsx'))).toBe(false);
  });
});
