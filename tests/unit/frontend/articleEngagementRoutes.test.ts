import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const member = {
  id: 'member-1',
  telegramId: 123,
  username: 'raka_macro',
  displayName: 'Raka Macro',
  avatarUrl: null,
  role: 'member' as const,
  badge: 'verified_member' as const,
  verifiedMemberAt: '2026-05-15T00:00:00.000Z',
};

function request(path: string, init: RequestInit = {}) {
  return new NextRequest(`https://example.com${path}`, {
    ...init,
    headers: {
      'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 200)}`,
      ...(init.headers ?? {}),
    },
  });
}

function mockRateLimit() {
  vi.doMock('../../../frontend/src/lib/rateLimit', () => ({
    checkRateLimit: vi.fn(() => null),
  }));
  vi.doMock('@/lib/rateLimit', () => ({
    checkRateLimit: vi.fn(() => null),
  }));
}

function mockMember(user: typeof member | null) {
  vi.doMock('../../../frontend/src/lib/memberAuth', () => ({
    getCurrentMember: vi.fn(async () => user),
  }));
  vi.doMock('@/lib/memberAuth', () => ({
    getCurrentMember: vi.fn(async () => user),
  }));
}

describe('article engagement routes', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@shared/db');
    vi.doUnmock('@/lib/memberAuth');
    vi.doUnmock('@/lib/rateLimit');
    vi.doUnmock('../../../frontend/src/lib/memberAuth');
    vi.doUnmock('../../../frontend/src/lib/rateLimit');
  });

  it('rejects anonymous article comments', async () => {
    vi.resetModules();
    mockRateLimit();
    mockMember(null);
    const query = vi.fn();
    vi.doMock('@shared/db', () => ({ query, queryOne: vi.fn() }));

    const { POST } = await import('../../../frontend/src/app/api/comments/route');
    const response = await POST(request('/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        article_id: 'article-1',
        content: 'Anonymous should not pass',
        is_anonymous: true,
        display_name: 'Anonim',
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.error_code).toBe('AUTH_REQUIRED');
    expect(query).not.toHaveBeenCalled();
  });

  it('stores article comments as the logged-in member', async () => {
    vi.resetModules();
    mockRateLimit();
    mockMember(member);
    const query = vi.fn(async (_sql: string, values: unknown[]) => ({
      rows: [{
        id: 'comment-1',
        display_name: values[2],
        content: values[3],
        is_anonymous: values[4],
        created_at: new Date('2026-05-17T09:00:00.000Z'),
        user_id: values[1],
      }],
    }));
    vi.doMock('@shared/db', () => ({ query, queryOne: vi.fn() }));

    const { POST } = await import('../../../frontend/src/app/api/comments/route');
    const response = await POST(request('/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        article_id: 'article-1',
        content: 'Member comment',
        is_anonymous: true,
        display_name: 'Anonim',
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO comments'),
      ['article-1', 'member-1', '@raka_macro', 'Member comment', false, 'visible'],
    );
    expect(body.data).toMatchObject({
      display_name: '@raka_macro',
      is_anonymous: false,
      user_id: 'member-1',
    });
  });

  it('rejects anonymous article likes', async () => {
    vi.resetModules();
    mockRateLimit();
    mockMember(null);
    const query = vi.fn();
    const queryOne = vi.fn();
    vi.doMock('@shared/db', () => ({ query, queryOne }));

    const { POST } = await import('../../../frontend/src/app/api/likes/route');
    const response = await POST(request('/api/likes', {
      method: 'POST',
      body: JSON.stringify({ article_id: 'article-1' }),
    }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.error_code).toBe('AUTH_REQUIRED');
    expect(query).not.toHaveBeenCalled();
    expect(queryOne).not.toHaveBeenCalled();
  });

  it('toggles article likes using the logged-in member identity', async () => {
    vi.resetModules();
    mockRateLimit();
    mockMember(member);
    const query = vi.fn(async () => ({ rows: [] }));
    const queryOne = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ count: '1' });
    vi.doMock('@shared/db', () => ({ query, queryOne }));

    const { POST } = await import('../../../frontend/src/app/api/likes/route');
    const response = await POST(request('/api/likes', {
      method: 'POST',
      body: JSON.stringify({ article_id: 'article-1' }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(queryOne).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT id FROM likes'),
      ['article-1', 'member:member-1'],
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO likes'),
      ['article-1', 'member:member-1'],
    );
    expect(body.data).toMatchObject({ liked: true, like_count: 1 });
  });
});
