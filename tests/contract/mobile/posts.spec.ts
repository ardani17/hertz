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

  it('returns feed envelope', async () => {
    vi.doMock('@shared/services/hertzPostService', () => ({
      HertzPostService: vi.fn().mockImplementation(() => ({
        listFeed: vi.fn(async () => ({ items: [{ id: 'post-1', shortId: 'hz_1' }], nextCursor: null })),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/posts')));
    expect(body.data.items[0].shortId).toBe('hz_1');
  });

  it('returns post detail envelope', async () => {
    vi.doMock('@shared/services/hertzPostService', () => ({
      HertzPostService: vi.fn().mockImplementation(() => ({
        getPostDetail: vi.fn(async () => ({ id: 'post-1', shortId: 'hz_1', comments: [] })),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/[shortId]/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/posts/hz_1'), { params: Promise.resolve({ shortId: 'hz_1' }) }));
    expect(body.data.post.shortId).toBe('hz_1');
  });

  it('updates post envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzPostService', () => ({
      HertzPostService: vi.fn().mockImplementation(() => ({
        editPost: vi.fn(async () => undefined),
        updateMarketContext: vi.fn(async () => undefined),
      })),
    }));
    const { PATCH } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/[shortId]/route');
    const body = await expectEnvelope(await PATCH(request('/api/mobile/v1/hertz/posts/hz_1', {
      method: 'PATCH',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ content: 'updated' }),
    }), { params: Promise.resolve({ shortId: 'hz_1' }) }));
    expect(body.data.updated).toBe(true);
  });

  it('deletes post envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzPostService', () => ({
      HertzPostService: vi.fn().mockImplementation(() => ({
        deletePost: vi.fn(async () => undefined),
      })),
    }));
    const { DELETE } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/[shortId]/route');
    const body = await expectEnvelope(await DELETE(request('/api/mobile/v1/hertz/posts/hz_1', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-token' },
    }), { params: Promise.resolve({ shortId: 'hz_1' }) }));
    expect(body.data.deleted).toBe(true);
  });

  it('lists comments envelope', async () => {
    vi.doMock('@shared/services/hertzPostService', () => ({
      HertzPostService: vi.fn().mockImplementation(() => ({
        getPostDetail: vi.fn(async () => ({ id: 'post-1', shortId: 'hz_1', comments: [{ id: 'comment-1', content: 'hi' }] })),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/[shortId]/comments/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/posts/hz_1/comments'), { params: Promise.resolve({ shortId: 'hz_1' }) }));
    expect(body.data.comments[0].id).toBe('comment-1');
  });

  it('updates comment envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzCommentService', () => ({
      HertzCommentService: vi.fn().mockImplementation(() => ({
        edit: vi.fn(async () => undefined),
      })),
    }));
    const { PATCH } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/comments/[commentId]/route');
    const body = await expectEnvelope(await PATCH(request('/api/mobile/v1/hertz/posts/comments/comment-1', {
      method: 'PATCH',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ content: 'edited' }),
    }), { params: Promise.resolve({ commentId: 'comment-1' }) }));
    expect(body.data.updated).toBe(true);
  });

  it('deletes comment envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzCommentService', () => ({
      HertzCommentService: vi.fn().mockImplementation(() => ({
        delete: vi.fn(async () => undefined),
      })),
    }));
    const { DELETE } = await import('../../../frontend/src/app/api/mobile/v1/hertz/posts/comments/[commentId]/route');
    const body = await expectEnvelope(await DELETE(request('/api/mobile/v1/hertz/posts/comments/comment-1', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-token' },
    }), { params: Promise.resolve({ commentId: 'comment-1' }) }));
    expect(body.data.deleted).toBe(true);
  });
});

