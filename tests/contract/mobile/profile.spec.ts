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

  it('updates own profile envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzMemberProfileService', () => ({
      HertzMemberProfileService: vi.fn().mockImplementation(() => ({
        updateOwnProfile: vi.fn(async () => ({ userId: 'member-1', displayName: 'Updated Member' })),
      })),
    }));
    const { PATCH } = await import('../../../frontend/src/app/api/mobile/v1/profile/me/route');
    const body = await expectEnvelope(await PATCH(request('/api/mobile/v1/profile/me', {
      method: 'PATCH',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ displayName: 'Updated Member' }),
    })));
    expect(body.data.profile.displayName).toBe('Updated Member');
  });

  it('returns public profile envelope', async () => {
    vi.doMock('@shared/services/hertzPublicProfileService', () => ({
      HertzPublicProfileService: vi.fn().mockImplementation(() => ({
        getPublicProfileByUsername: vi.fn(async () => ({
          userId: 'member-1',
          username: 'member',
          displayName: 'Member',
          publicCounters: { posts: 1, followers: 0, following: 0 },
        })),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/profile/[username]/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/profile/member'), { params: Promise.resolve({ username: 'member' }) }));
    expect(body.data.profile.username).toBe('member');
  });
});

