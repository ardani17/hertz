import { describe, expect, it } from 'vitest';
import { getHertzHashtagHref, getHertzSearchEmptyState } from '../../../frontend/src/lib/hertzSearchUi';

describe('HERTZ social search UI helpers', () => {
  it('links hashtags back to social search', () => {
    expect(getHertzHashtagHref('#Gold')).toBe('/hertz?q=%23Gold');
    expect(getHertzHashtagHref('xauusd')).toBe('/hertz?q=%23xauusd');
  });

  it('uses a clear empty state for social search results', () => {
    expect(getHertzSearchEmptyState('btc')).toEqual({
      title: 'Tidak ada hasil',
      body: 'Belum ada post, member, topik, atau pair untuk "btc".',
    });
  });
});
