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
      validateToken: vi.fn(async (token: string | null) =>
        token === 'valid-token' ? { user, expiresAt: new Date('2026-05-22T00:00:00.000Z') } : null,
      ),
      createSession: vi.fn(async () => ({
        token: 'new-mobile-token',
        expiresAt: new Date('2026-05-22T00:00:00.000Z'),
        sessionId: 'session-1',
      })),
      listActiveSessions: vi.fn(async () => [{
        id: 'session-1',
        expiresAt: new Date('2026-05-22T00:00:00.000Z'),
        createdAt: new Date('2026-05-15T00:00:00.000Z'),
        lastUsedAt: new Date('2026-05-15T00:00:00.000Z'),
      }]),
      deleteSessionByIdForUser: vi.fn(async () => undefined),
      deleteSession: vi.fn(async () => undefined),
      refreshSession: vi.fn(async (token: string | null) =>
        token === 'valid-token'
          ? {
              token: 'valid-token',
              expiresAt: new Date('2026-05-22T00:00:00.000Z'),
              user,
            }
          : null,
      ),
    })),
    hashMemberSessionToken: vi.fn((token: string) => `hash:${token}`),
  }));
}

describe('mobile route contracts', () => {
  afterEach(() => {
    vi.doUnmock('@shared/services/memberSessionService');
    vi.doUnmock('@/server/services/auth/MobileAuthService');
    vi.doUnmock('@shared/services/membershipService');
    vi.doUnmock('@shared/services/deviceTokenService');
  });

  it('GET /api/mobile/v1/me resolves bearer auth and returns the standard envelope', async () => {
    vi.resetModules();
    mockMemberSessionService();
    vi.doMock('@/server/services/auth/MobileAuthService', () => ({
      MobileAuthService: vi.fn().mockImplementation(() => ({
        buildMe: vi.fn(async () => ({
          user,
          notifications: { unreadCount: 0, hasUnread: false, unreadDmCount: 0, hasUnreadDm: false },
          session: {
            id: 'session-1',
            deviceId: null,
            platform: null,
            appVersion: null,
            expiresAt: '2026-05-22T00:00:00.000Z',
            createdAt: '2026-05-15T00:00:00.000Z',
            lastUsedAt: '2026-05-15T00:00:00.000Z',
            current: true,
          },
        })),
      })),
    }));
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

  it('POST /api/mobile/v1/notifications/register accepts Expo push tokens', async () => {
    vi.resetModules();
    mockMemberSessionService();
    vi.doMock('@shared/services/deviceTokenService', () => ({
      DeviceTokenService: vi.fn().mockImplementation(() => ({
        register: vi.fn(async () => ({
          id: 'device-token-2',
          platform: 'expo',
          device_id: 'iphone-1',
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
        platform: 'expo',
        token: 'ExponentPushToken[abc_123]',
        deviceId: 'iphone-1',
        appVersion: '1.0.0',
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.deviceToken.platform).toBe('expo');
  });

  it('GET /api/mobile/v1/outlook includes optional Outlook metadata in the article payload', async () => {
    vi.resetModules();
    const queryMock = vi.fn(async () => ({
      rows: [{
        id: 'outlook-1',
        title: 'NASDAQ session prep',
        content_html: '',
        slug: 'nasdaq-session-prep',
        source: 'dashboard',
        category: 'outlook',
        created_at: new Date('2026-05-17T09:00:00.000Z'),
        updated_at: new Date('2026-05-17T09:00:00.000Z'),
        author_id: 'admin-1',
        author_username: 'hertz',
        author_display_name: 'Hertz',
        author_avatar_url: null,
        cover_image: null,
        outlook_metadata: {
          contentType: 'video',
          videoUrl: 'https://example.com/session.mp4',
          summary: 'Watch liquidity above previous high.',
          bias: 'Neutral Bullish',
          keyPoints: ['Wait confirmation'],
        },
        comment_count: '0',
        like_count: '0',
      }],
    }));
    vi.doMock('@shared/db', () => ({
      query: queryMock,
      queryOne: vi.fn(),
    }));

    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/outlook/route');
    const response = await GET(request('/api/mobile/v1/outlook'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.items[0]).toMatchObject({
      id: 'outlook-1',
      category: 'outlook',
      outlook: {
        kind: 'video',
        summary: 'Watch liquidity above previous high.',
        snapshot: [{ label: 'Bias', value: 'Neutral Bullish' }],
        keyPoints: ['Wait confirmation'],
      },
    });
  });
});
