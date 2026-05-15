import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const user = {
  id: 'member-1',
  telegramId: 123,
  username: 'member',
  displayName: 'Member',
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

function mockMemberSessionService() {
  vi.doMock('@shared/services/memberSessionService', () => ({
    MemberSessionService: vi.fn().mockImplementation(() => ({
      validateToken: vi.fn(async (token: string | null) => (token === 'valid-token' ? user : null)),
      createSession: vi.fn(async () => ({
        token: 'new-mobile-token',
        expiresAt: new Date('2026-05-22T00:00:00.000Z'),
      })),
      deleteSession: vi.fn(async () => undefined),
      refreshSession: vi.fn(async () => ({
        token: 'refreshed-token',
        expiresAt: new Date('2026-05-22T00:00:00.000Z'),
        user,
      })),
    })),
    hashMemberSessionToken: vi.fn((token: string) => `hash:${token}`),
  }));
}

describe('mobile route contracts', () => {
  afterEach(() => {
    vi.doUnmock('@shared/services/memberSessionService');
    vi.doUnmock('@shared/services/membershipService');
    vi.doUnmock('@shared/services/deviceTokenService');
  });

  it('GET /api/mobile/v1/me resolves bearer auth and returns the standard envelope', async () => {
    vi.resetModules();
    mockMemberSessionService();
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/me/route');

    const response = await GET(request('/api/mobile/v1/me', {
      headers: { authorization: 'Bearer valid-token' },
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ success: true, data: { user } });
  });

  it('POST /api/mobile/v1/auth/telegram returns a raw token and session metadata', async () => {
    vi.resetModules();
    mockMemberSessionService();
    vi.doMock('@shared/services/membershipService', () => ({
      MembershipService: vi.fn().mockImplementation(() => ({
        verifyLogin: vi.fn(async () => user),
      })),
      MembershipCheckUnavailableError: class MembershipCheckUnavailableError extends Error {},
      NotGroupMemberError: class NotGroupMemberError extends Error {},
      TelegramAuthInvalidError: class TelegramAuthInvalidError extends Error {},
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/auth/telegram/route');

    const response = await POST(request('/api/mobile/v1/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({
        id: 123,
        first_name: 'Member',
        auth_date: 1_778_840_000,
        hash: 'signature',
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      success: true,
      data: {
        token: 'new-mobile-token',
        expiresAt: '2026-05-22T00:00:00.000Z',
        user,
      },
    });
  });

  it('POST /api/mobile/v1/notifications/register requires bearer auth and returns device metadata', async () => {
    vi.resetModules();
    mockMemberSessionService();
    vi.doMock('@shared/services/deviceTokenService', () => ({
      DeviceTokenService: vi.fn().mockImplementation(() => ({
        register: vi.fn(async () => ({
          id: 'device-token-1',
          platform: 'android',
          device_id: 'pixel-1',
          app_version: '1.0.0',
          enabled: true,
          last_seen_at: new Date('2026-05-15T00:00:00.000Z'),
        })),
      })),
      DeviceTokenValidationError: class DeviceTokenValidationError extends Error {},
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/notifications/register/route');

    const response = await POST(request('/api/mobile/v1/notifications/register', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({
        platform: 'android',
        token: 'fcm-token',
        deviceId: 'pixel-1',
        appVersion: '1.0.0',
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      success: true,
      data: {
        deviceToken: {
          id: 'device-token-1',
          platform: 'android',
          enabled: true,
        },
      },
    });
  });
});
