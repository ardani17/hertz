import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, mockMemberSessionService, request, unmockCommon } from './helpers';

describe('mobile posts contract', () => {
  afterEach(unmockCommon);

  it('creates post envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzPostService', () => ({
      HertzPostService: vi.fn().mockImplementation(() => ({
        createWebPost: vi.fn(async () => ({ id: 'post-1', shortId: 'hz_1' })),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/posts', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ category: 'general', content: 'hello' }),
    })), 201);
    expect(body.data.post.shortId).toBe('hz_1');
  });

  it('adds comment reply envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzCommentService', () => ({
      HertzCommentService: vi.fn().mockImplementation(() => ({
        create: vi.fn(async () => ({ id: 'comment-1', content: 'reply' })),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/[shortId]/comments/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/posts/hz_1/comments', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ content: 'reply', parentCommentId: 'comment-root' }),
    }), { params: Promise.resolve({ shortId: 'hz_1' }) }), 201);
    expect(body.data.comment.id).toBe('comment-1');
  });
});

