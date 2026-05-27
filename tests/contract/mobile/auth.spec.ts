import { afterEach, describe, expect, it, vi } from 'vitest';
import { contractUser, expectEnvelope, mockMemberSessionService, request, unmockCommon } from './helpers';

describe('mobile auth contract', () => {
  afterEach(unmockCommon);

  it('creates handoff nonce envelope', async () => {
    vi.doMock('@shared/services/mobileAuthService', () => ({
      MobileAuthService: vi.fn().mockImplementation(() => ({
        initHandoff: vi.fn(async () => ({ nonce: 'nonce-1', expiresAt: '2026-05-22T00:00:00.000Z', handoffUrl: 'https://example.com/auth/mobile-handoff?nonce=nonce-1' })),
      })),
    }));
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

  it('me returns user notifications and session', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/mobileAuthService', () => ({
      MobileAuthService: vi.fn().mockImplementation(() => ({
        buildMe: vi.fn(async () => ({
          user: contractUser,
          notifications: { unreadCount: 1, hasUnread: true, unreadDmCount: 0, hasUnreadDm: false },
          session: { id: 'session-1', deviceId: 'device-1', platform: 'ios', appVersion: '1.0.0', expiresAt: '2026-05-22T00:00:00.000Z', createdAt: '2026-05-15T00:00:00.000Z', lastUsedAt: null, current: true },
        })),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/me/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/me', { headers: { authorization: 'Bearer valid-token' } })));
    expect(body.data.user.id).toBe(contractUser.id);
    expect(body.data.session.deviceId).toBe('device-1');
  });
});

