import { describe, expect, it } from 'vitest';
import { buildOutlookArticlePath, parseOutlookArticlePathname } from '@/lib/outlookSpa';

describe('outlookSpa', () => {
  it('parses outlook article pathname', () => {
    expect(parseOutlookArticlePathname('/outlook/market-weekly')).toBe('market-weekly');
    expect(parseOutlookArticlePathname('/outlook')).toBeNull();
  });

  it('builds outlook paths', () => {
    expect(buildOutlookArticlePath('market weekly')).toBe('/outlook/market%20weekly');
  });
});
