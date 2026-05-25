import { describe, expect, it } from 'vitest';
import {
  buildPublicProfilePostUrl,
  getPublicProfileBasePath,
  hasLegacyHertzPostQuery,
  parseLegacyHertzPostQuery,
  stripLegacyHertzPostQuery,
} from '../../../frontend/src/lib/hertzPostSpa';

describe('public profile post SPA URLs', () => {
  it('builds profile base and post query URLs', () => {
    expect(getPublicProfileBasePath('Candra333')).toBe('/@Candra333');
    expect(buildPublicProfilePostUrl('Candra333', 'hz_abc')).toBe('/@Candra333?post=hz_abc');
  });

  it('parses and strips legacy post query params', () => {
    expect(hasLegacyHertzPostQuery('?post=hz_abc')).toBe(true);
    expect(parseLegacyHertzPostQuery('?post=hz_abc')).toBe('hz_abc');
    expect(stripLegacyHertzPostQuery('?post=hz_abc&tab=posts')).toBe('?tab=posts');
    expect(stripLegacyHertzPostQuery('?post=hz_abc')).toBe('');
  });
});
