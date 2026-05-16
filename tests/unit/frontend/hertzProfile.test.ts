import { describe, expect, it } from 'vitest';
import { buildProfileActivityTabs } from '../../../shared/services/hertzProfileService';

describe('HERTZ profile frontend labels', () => {
  it('keeps saved history discoverable from profile', () => {
    const labels = buildProfileActivityTabs({ posts: [], saved: [], reposts: [], comments: [] }).map((tab) => tab.label);
    expect(labels).toContain('Disimpan');
  });
});
