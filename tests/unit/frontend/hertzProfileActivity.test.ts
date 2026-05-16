import { describe, expect, it } from 'vitest';
import {
  getDefaultProfileActivityTab,
  getProfileActivityPanel,
  profileActivityTabKeys,
} from '../../../frontend/src/lib/hertzProfileActivity';

describe('HERTZ profile activity tabs', () => {
  const activity = {
    posts: [{ id: '1', shortId: 'hz_1', label: 'Post', text: 'My post', createdAt: '2026-05-16T00:00:00.000Z' }],
    saved: [{ id: '2', shortId: 'hz_2', label: 'Disimpan', text: 'Saved post', createdAt: '2026-05-16T00:00:00.000Z' }],
    reposts: [],
    comments: [],
  };

  it('defaults to the own-posts tab', () => {
    expect(getDefaultProfileActivityTab()).toBe('posts');
    expect(profileActivityTabKeys).toContain('saved');
  });

  it('returns only the active activity panel data', () => {
    expect(getProfileActivityPanel(activity, 'saved')).toEqual({
      title: 'Disimpan',
      empty: 'Belum ada postingan yang disimpan.',
      items: activity.saved,
    });
  });

  it('uses informational panels for credit and Telegram session tabs', () => {
    expect(getProfileActivityPanel(activity, 'credit').items).toEqual([]);
    expect(getProfileActivityPanel(activity, 'session').title).toBe('Setting Telegram/session');
  });
});
