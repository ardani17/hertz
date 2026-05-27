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

  it('toggles like', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzInteractionService', () => ({
      HertzReactionService: vi.fn().mockImplementation(() => ({ togglePulse: vi.fn(async () => ({ active: true })) })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/[shortId]/like/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/posts/hz_1/like', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
    }), { params: Promise.resolve({ shortId: 'hz_1' }) }));
    expect(body.data.liked).toBe(true);
  });

  it('creates repost envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzInteractionService', () => ({
      HertzRepostService: vi.fn().mockImplementation(() => ({ repost: vi.fn(async () => ({ post: { id: 'post-2', shortId: 'hz_2' } })) })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/[shortId]/repost/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/posts/hz_1/repost', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ type: 'plain' }),
    }), { params: Promise.resolve({ shortId: 'hz_1' }) }), 201);
    expect(body.data.post.shortId).toBe('hz_2');
  });

  it('reports post envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzReportService', () => ({
      HertzReportService: vi.fn().mockImplementation(() => ({
        createPostReport: vi.fn(async () => ({ id: 'report-1', status: 'open' })),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/[shortId]/report/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/posts/hz_1/report', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ reason: 'spam' }),
    }), { params: Promise.resolve({ shortId: 'hz_1' }) }), 201);
    expect(body.data.report.id).toBe('report-1');
  });
});

