import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, mockMemberSessionService, request, unmockCommon } from './helpers';

describe('mobile interactions contract', () => {
  afterEach(unmockCommon);

  it('toggles bookmark', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzInteractionService', () => ({
      HertzBookmarkService: vi.fn().mockImplementation(() => ({ toggleBookmark: vi.fn(async () => ({ active: true })) })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/[shortId]/bookmark/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/posts/hz_1/bookmark', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
    }), { params: Promise.resolve({ shortId: 'hz_1' }) }));
    expect(body.data.bookmarked).toBe(true);
  });

  it('records view', async () => {
    vi.doMock('@shared/services/hertzInteractionService', () => ({
      HertzViewService: vi.fn().mockImplementation(() => ({ recordView: vi.fn(async () => ({ recorded: true })) })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/[shortId]/view/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/posts/hz_1/view', { method: 'POST' }), { params: Promise.resolve({ shortId: 'hz_1' }) }));
    expect(body.data.recorded).toBe(true);
  });
});

