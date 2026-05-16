import { describe, expect, it } from 'vitest';
import { extractHertzTopics, normalizeHertzSearchQuery } from '../../../shared/services/hertzSearchService';

describe('HertzSearchService helpers', () => {
  it('normalizes short social search queries', () => {
    expect(normalizeHertzSearchQuery('  xau  ')).toBe('xau');
    expect(normalizeHertzSearchQuery('a')).toBe(null);
  });

  it('extracts unique hashtags as lower-case topics', () => {
    expect(extractHertzTopics('Setup #XAUUSD entry #gold lalu #XAUUSD')).toEqual(['xauusd', 'gold']);
  });
});
