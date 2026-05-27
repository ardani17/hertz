import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, mockMemberSessionService, request, unmockCommon } from './helpers';

describe('mobile profile contract', () => {
  afterEach(unmockCommon);

  it('returns own profile', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzMemberProfileService', () => ({
      HertzMemberProfileService: vi.fn().mockImplementation(() => ({ getOwnProfile: vi.fn(async () => ({ userId: 'member-1', displayName: 'Member' })) })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/profile/me/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/profile/me', { headers: { authorization: 'Bearer valid-token' } })));
    expect(body.data.profile.userId).toBe('member-1');
  });

  it('returns public profile activity', async () => {
    vi.doMock('@shared/db', () => ({
      queryOne: vi.fn(async () => ({ id: 'member-1' })),
      query: vi.fn(async () => ({ rows: [] })),
    }));
    vi.doMock('@shared/services/hertzProfileService', () => ({
      HertzProfileService: vi.fn().mockImplementation(() => ({ getActivity: vi.fn(async () => ({ posts: [], saved: [], reposts: [], comments: [] })) })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/profile/[username]/activity/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/profile/member/activity'), { params: Promise.resolve({ username: 'member' }) }));
    expect(body.data.activity.posts).toEqual([]);
  });
});

