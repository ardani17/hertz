import { afterEach, describe, expect, it, vi } from 'vitest';
import { contractUser, expectEnvelope, mockMemberSessionService, request, unmockCommon } from './helpers';

describe('mobile auth contract', () => {
  afterEach(unmockCommon);

  it('creates handoff nonce envelope', async () => {
    vi.doMock('@/server/services/auth/MobileAuthService', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../frontend/src/server/services/auth/MobileAuthService')>();
      return {
        ...actual,
        MobileAuthService: vi.fn().mockImplementation(() => ({
          initHandoff: vi.fn(async () => ({ nonce: 'nonce-1', expiresAt: '2026-05-22T00:00:00.000Z', handoffUrl: 'https://example.com/auth/mobile-handoff?nonce=nonce-1' })),
        })),
      };
    });
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/auth/handoff/init/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/auth/handoff/init', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'device-1', platform: 'ios', appVersion: '1.0.0' }),
    })), 201);
    expect(body.data.nonce).toBe('nonce-1');
  });

  it('refresh rejects mismatched device', async () => {
    mockMemberSessionService();
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/auth/refresh/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/auth/refresh', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ deviceId: 'other-device' }),
    })), 401);
    expect(body.error.code).toBe('SESSION_DEVICE_MISMATCH');
  });

  it('logout returns loggedOut envelope', async () => {
    mockMemberSessionService();
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/logout/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/logout', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
    })));
    expect(body.data.loggedOut).toBe(true);
  });

  it('me returns user notifications and session', async () => {
    mockMemberSessionService();
    vi.doMock('@/server/services/auth/MobileAuthService', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../frontend/src/server/services/auth/MobileAuthService')>();
      return {
        ...actual,
        MobileAuthService: vi.fn().mockImplementation(() => ({
          buildMe: vi.fn(async () => ({
            user: contractUser,
            notifications: { unreadCount: 1, hasUnread: true, unreadDmCount: 0, hasUnreadDm: false },
            session: { id: 'session-1', deviceId: 'device-1', platform: 'ios', appVersion: '1.0.0', expiresAt: '2026-05-22T00:00:00.000Z', createdAt: '2026-05-15T00:00:00.000Z', lastUsedAt: null, current: true },
          })),
        })),
      };
    });
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/me/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/me', { headers: { authorization: 'Bearer valid-token' } })));
    expect(body.data.user.id).toBe(contractUser.id);
    expect(body.data.session.deviceId).toBe('device-1');
  });

  it('exchanges handoff nonce for session envelope', async () => {
    vi.doMock('@/server/services/auth/MobileAuthService', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../frontend/src/server/services/auth/MobileAuthService')>();
      return {
        ...actual,
        MobileAuthService: vi.fn().mockImplementation(() => ({
          exchangeHandoff: vi.fn(async () => ({
            token: 'new-mobile-token',
            expiresAt: '2026-05-22T00:00:00.000Z',
            user: contractUser,
            session: { id: 'session-1', deviceId: 'device-1', platform: 'ios', appVersion: '1.0.0', expiresAt: '2026-05-22T00:00:00.000Z', createdAt: '2026-05-15T00:00:00.000Z', lastUsedAt: null, current: true },
          })),
        })),
      };
    });
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/auth/handoff/exchange/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/auth/handoff/exchange', {
      method: 'POST',
      body: JSON.stringify({ nonce: 'nonce-1', deviceId: 'device-1', platform: 'ios', appVersion: '1.0.0' }),
    })));
    expect(body.data.token).toBe('new-mobile-token');
  });

  it('refresh returns rotated token envelope', async () => {
    mockMemberSessionService();
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/auth/refresh/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/auth/refresh', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ deviceId: 'device-1' }),
    })));
    expect(body.data.token).toBe('rotated-token');
    expect(body.data.user.id).toBe(contractUser.id);
  });

  it('lists active sessions envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@/server/services/auth/MobileAuthService', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../frontend/src/server/services/auth/MobileAuthService')>();
      return {
        ...actual,
        MobileAuthService: vi.fn().mockImplementation(() => ({
          listSessions: vi.fn(async () => ({
            sessions: [{ id: 'session-1', deviceId: 'device-1', platform: 'ios', appVersion: '1.0.0', expiresAt: '2026-05-22T00:00:00.000Z', createdAt: '2026-05-15T00:00:00.000Z', lastUsedAt: null, current: true }],
          })),
        })),
      };
    });
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/me/sessions/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/me/sessions', { headers: { authorization: 'Bearer valid-token' } })));
    expect(body.data.sessions[0].id).toBe('session-1');
  });

  it('revokes session envelope', async () => {
    mockMemberSessionService();
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
    const body = await expectEnvelope(await DELETE(request('/api/mobile/v1/me/sessions/session-2', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-token' },
    }), { params: Promise.resolve({ sessionId: 'session-2' }) }));
    expect(body.data.revoked).toBe(true);
  });

  it('creates telegram session envelope', async () => {
    vi.doMock('@/server/services/auth/MobileAuthService', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../frontend/src/server/services/auth/MobileAuthService')>();
      return {
        ...actual,
        MobileAuthService: vi.fn().mockImplementation(() => ({
          createTelegramSession: vi.fn(async () => ({
            token: 'telegram-token',
            expiresAt: '2026-05-22T00:00:00.000Z',
            user: contractUser,
            session: { id: 'session-1', deviceId: 'device-1', platform: 'ios', appVersion: '1.0.0', expiresAt: '2026-05-22T00:00:00.000Z', createdAt: '2026-05-15T00:00:00.000Z', lastUsedAt: null, current: true },
          })),
        })),
      };
    });
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/auth/telegram/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ id: 123, hash: 'abc', auth_date: 1710000000, deviceId: 'device-1', platform: 'ios', appVersion: '1.0.0' }),
    })), 201);
    expect(body.data.token).toBe('telegram-token');
  });
});

