import { describe, expect, it } from 'vitest';
import {
  HERTZ_CARD_OUTLINE,
  getHertzFeedEmptyState,
  getHertzFeedErrorState,
} from '../../../frontend/src/lib/hertzFeedUi';

describe('HERTZ feed UI states', () => {
  it('uses the same thin green outline token for composer and posts', () => {
    expect(HERTZ_CARD_OUTLINE).toBe('rgba(19, 210, 123, 0.26)');
  });

  it('returns a clear empty state for the default feed', () => {
    expect(getHertzFeedEmptyState({ activeSearch: null, activeCategory: null })).toEqual({
      title: 'Belum ada post',
      body: 'Postingan Telegram dan web member akan muncul di sini.',
    });
  });

  it('returns a specific empty state for social search', () => {
    expect(getHertzFeedEmptyState({ activeSearch: 'xauusd', activeCategory: null }).title).toBe('Tidak ada hasil');
  });

  it('returns an actionable error state', () => {
    expect(getHertzFeedErrorState('Koneksi database gagal')).toEqual({
      title: 'Feed belum bisa dimuat',
      body: 'Koneksi database gagal',
    });
  });
});
