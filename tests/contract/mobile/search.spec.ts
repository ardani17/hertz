import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, request, unmockCommon } from './helpers';

describe('mobile search contract', () => {
  afterEach(unmockCommon);

  it('returns search results envelope', async () => {
    vi.doMock('@shared/services/hertzSearchService', () => ({
      HertzSearchService: vi.fn().mockImplementation(() => ({
        search: vi.fn(async () => ({ query: 'hertz', results: [{ type: 'member', id: 'member-1', label: 'Member', description: '@member', href: '/hertz?q=member' }], nextCursor: null })),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/search/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/search?q=hertz&type=member')));
    expect(body.data.results[0].type).toBe('member');
  });
});

