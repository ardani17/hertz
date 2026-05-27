import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

function request(path: string, init: RequestInit = {}) {
  return new NextRequest(`https://example.com${path}`, {
    ...init,
    headers: {
      'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 200)}`,
      ...(init.headers ?? {}),
    },
  });
}

describe('mobile auth handoff routes', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/server/services/auth/MobileAuthService');
    vi.doUnmock('@shared/services/memberSessionService');
    vi.doUnmock('@/lib/memberAuth');
    vi.doUnmock('@/lib/mobileApi');
  });

  it('creates a login handoff nonce', async () => {
    vi.doMock('@/server/services/auth/MobileAuthService', () => ({
      MobileAuthService: vi.fn().mockImplementation(() => ({
        initHandoff: vi.fn(async () => ({
          nonce: 'nonce-1',
          expiresAt: '2026-05-22T00:00:00.000Z',
          handoffUrl: 'https://hertz.cloudnexify.com/auth/mobile-handoff?nonce=nonce-1',
        })),
      })),
    }));

    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/auth/handoff/init/route');
    const response = await POST(request('/api/mobile/v1/auth/handoff/init', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'device-1', platform: 'ios', appVersion: '1.0.0' }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({ nonce: 'nonce-1' });
  });

  it('exchanges a nonce for a bearer token', async () => {
    vi.doMock('@/server/services/auth/MobileAuthService', () => ({
      MobileAuthService: vi.fn().mockImplementation(() => ({
        exchangeHandoff: vi.fn(async () => ({
          token: 'mobile-token',
          expiresAt: '2026-05-22T00:00:00.000Z',
          user: { id: 'member-1' },
          loginMechanism: 'telegram_external_browser_callback',
        })),
      })),
    }));

    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/auth/handoff/exchange/route');
    const response = await POST(request('/api/mobile/v1/auth/handoff/exchange', {
      method: 'POST',
      body: JSON.stringify({ nonce: 'nonce-1', telegramAuth: { id: 1, first_name: 'A', auth_date: 1, hash: 'h' } }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.token).toBe('mobile-token');
  });
});

describe('mobile auth session routes', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/server/services/auth/MobileAuthService');
    vi.doUnmock('@shared/services/memberSessionService');
    vi.doUnmock('@/lib/memberAuth');
    vi.doUnmock('@/lib/mobileApi');
  });

  function mockMobileAuthContext() {
    vi.doMock('@/lib/memberAuth', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../frontend/src/lib/memberAuth')>();
      return {
        ...actual,
        getCurrentBearerMemberFromRequest: vi.fn(async () => ({
          user: { id: 'member-1', role: 'member' },
          token: 'valid-token',
          source: 'bearer',
        })),
      };
    });
  }

  it('returns SESSION_DEVICE_MISMATCH on refresh mismatch', async () => {
    mockMobileAuthContext();
    vi.doMock('@shared/services/memberSessionService', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../shared/services/memberSessionService')>();
      return {
        ...actual,
        MemberSessionService: vi.fn().mockImplementation(() => ({
          refreshSession: vi.fn(async () => ({
            token: 'valid-token',
            expiresAt: new Date('2026-05-22T00:00:00.000Z'),
            user: { id: 'member-1' },
            session: {
              sessionId: 'session-1',
              deviceId: 'device-1',
              platform: 'ios',
              appVersion: '1.0.0',
              expiresAt: new Date('2026-05-22T00:00:00.000Z'),
              createdAt: new Date('2026-05-15T00:00:00.000Z'),
              lastUsedAt: null,
            },
          })),
          assertDeviceMatch: vi.fn(() => {
            throw new actual.SessionDeviceMismatchError();
          }),
        })),
      };
    });

    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/auth/refresh/route');
    const response = await POST(request('/api/mobile/v1/auth/refresh', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ deviceId: 'other-device' }),
    }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('SESSION_DEVICE_MISMATCH');
  });

  it('lists active sessions', async () => {
    mockMobileAuthContext();
    vi.doMock('@/server/services/auth/MobileAuthService', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../frontend/src/server/services/auth/MobileAuthService')>();
      return {
        ...actual,
        MobileAuthService: vi.fn().mockImplementation(() => ({
          listSessions: vi.fn(async () => ({
            sessions: [{ id: 'session-1', deviceId: 'device-1', current: true }],
          })),
        })),
      };
    });

    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/me/sessions/route');
    const response = await GET(request('/api/mobile/v1/me/sessions', { headers: { authorization: 'Bearer valid-token' } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.sessions[0].id).toBe('session-1');
  });

  it('revokes a non-current session', async () => {
    mockMobileAuthContext();
    vi.doMock('@/server/services/auth/MobileAuthService', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../frontend/src/server/services/auth/MobileAuthService')>();
      return {
        ...actual,
        MobileAuthService: vi.fn().mockImplementation(() => ({
          revokeSession: vi.fn(async () => undefined),
        })),
      };
    });

    const { DELETE } = await import('../../../frontend/src/app/api/mobile/v1/me/sessions/[sessionId]/route');
    const response = await DELETE(request('/api/mobile/v1/me/sessions/session-2', { method: 'DELETE', headers: { authorization: 'Bearer valid-token' } }), {
      params: Promise.resolve({ sessionId: 'session-2' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.revoked).toBe(true);
  });

  it('returns current user profile and notification summary', async () => {
    mockMobileAuthContext();
    vi.doMock('@/server/services/auth/MobileAuthService', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../frontend/src/server/services/auth/MobileAuthService')>();
      return {
        ...actual,
        MobileAuthService: vi.fn().mockImplementation(() => ({
          buildMe: vi.fn(async () => ({
            user: { id: 'member-1' },
            notifications: { unreadCount: 0, hasUnread: false, unreadDmCount: 0, hasUnreadDm: false },
            session: { id: 'session-1', current: true },
          })),
        })),
      };
    });

    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/me/route');
    const response = await GET(request('/api/mobile/v1/me', { headers: { authorization: 'Bearer valid-token' } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.notifications.unreadCount).toBe(0);
    expect(body.data.session.current).toBe(true);
  });
});
