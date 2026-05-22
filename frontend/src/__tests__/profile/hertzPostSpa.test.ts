import { describe, expect, it } from 'vitest';
import {
  buildHertzPostPath,
  hasLegacyHertzPostQuery,
  parseHertzPostPathname,
  parseLegacyHertzPostQuery,
} from '@/lib/hertzPostSpa';

describe('hertzPostSpa', () => {
  it('parses post pathname', () => {
    expect(parseHertzPostPathname('/hertz/post/hz_mticoc74')).toBe('hz_mticoc74');
    expect(parseHertzPostPathname('/hertz')).toBeNull();
  });

  it('builds canonical post paths', () => {
    expect(buildHertzPostPath('hz_abc')).toBe('/hertz/post/hz_abc');
  });

  it('reads legacy ?post= query', () => {
    expect(hasLegacyHertzPostQuery('?post=hz_x')).toBe(true);
    expect(parseLegacyHertzPostQuery('?post=hz_x')).toBe('hz_x');
  });
});
