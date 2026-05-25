import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('PublicProfilePostShell', () => {
  it('keeps post modal navigation on the profile URL instead of /hertz', () => {
    const source = readFileSync(
      join(process.cwd(), 'frontend/src/components/profile/PublicProfilePostShell.tsx'),
      'utf8',
    );

    expect(source).toContain('buildPublicProfilePostUrl');
    expect(source).toContain('getPublicProfileBasePath');
    expect(source).toContain('stripLegacyHertzPostQuery');
    expect(source).not.toContain("'/hertz'");
  });
});
