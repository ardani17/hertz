import { describe, expect, it } from 'vitest';
import { buildProfileActivityTabs, type HertzProfileActivity } from '../../../shared/services/hertzProfileService';

describe('HertzProfileService activity tabs', () => {
  it('builds profile activity tabs including saved history', () => {
    const activity: HertzProfileActivity = {
      posts: [{ id: '1', shortId: 'hz_1', label: 'Post', text: 'Post saya', createdAt: '2026-05-16T00:00:00.000Z' }],
      saved: [{ id: '2', shortId: 'hz_2', label: 'Disimpan', text: 'Saved', createdAt: '2026-05-16T00:00:00.000Z' }],
      reposts: [],
      comments: [],
    };

    expect(buildProfileActivityTabs(activity)).toEqual([
      { key: 'posts', label: 'Postingan', count: 1 },
      { key: 'saved', label: 'Disimpan', count: 1 },
      { key: 'reposts', label: 'Repost', count: 0 },
      { key: 'comments', label: 'Komentar', count: 0 },
    ]);
  });
});
