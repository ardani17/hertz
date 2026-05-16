import { describe, expect, it } from 'vitest';
import { getPlainRepostLabel, getRepostTimelineKey, isPlainRepostTimelineItem } from '../../../frontend/src/lib/hertzRepostUi';

describe('HERTZ repost timeline UI helpers', () => {
  const plainRepost = {
    id: 'repost-post-1',
    shortId: 'hz_repost1',
    type: 'repost',
    author: { name: 'ARDANI | vastara.id' },
    quotedPost: { id: 'original-post-1', shortId: 'hz_original1' },
  };

  it('identifies plain repost timeline items', () => {
    expect(isPlainRepostTimelineItem(plainRepost)).toBe(true);
    expect(isPlainRepostTimelineItem({ ...plainRepost, type: 'quote' })).toBe(false);
    expect(isPlainRepostTimelineItem({ ...plainRepost, quotedPost: null })).toBe(false);
  });

  it('uses the reposting member in the visible repost label', () => {
    expect(getPlainRepostLabel(plainRepost)).toBe('ARDANI | vastara.id merepost');
  });

  it('builds a stable timeline key that separates reposts from originals', () => {
    expect(getRepostTimelineKey(plainRepost)).toBe('repost:repost-post-1:hz_original1');
  });
});
