import { NextRequest } from 'next/server';
import { expect, vi } from 'vitest';

export const contractUser = {
  id: 'member-1',
  telegramId: 123,
  username: 'member',
  displayName: 'Member',
  avatarUrl: null,
  role: 'member' as const,
  badge: 'verified_member' as const,
  verifiedMemberAt: '2026-05-15T00:00:00.000Z',
};

export function request(path: string, init: RequestInit = {}) {
  return new NextRequest(`https://example.com${path}`, {
    ...init,
    headers: {
      'x-forwarded-for': '203.0.113.10',
      ...(init.headers ?? {}),
    },
  });
}

export function mockMemberSessionService() {
  vi.doMock('@shared/services/memberSessionService', async () => {
    const actual = await vi.importActual<typeof import('../../../shared/services/memberSessionService')>('@shared/services/memberSessionService');
    return {
      ...actual,
      MemberSessionService: vi.fn().mockImplementation(() => ({
        validateToken: vi.fn(async (token: string | null) =>
          token === 'valid-token' || token === 'rotated-token'
            ? {
                user: contractUser,
                expiresAt: new Date('2026-05-22T00:00:00.000Z'),
                sessionId: 'session-1',
                createdAt: new Date('2026-05-15T00:00:00.000Z'),
                lastUsedAt: new Date('2026-05-15T00:00:00.000Z'),
                deviceId: 'device-1',
                platform: 'ios',
                appVersion: '1.0.0',
              }
            : null,
        ),
        createSession: vi.fn(async () => ({
          token: 'new-mobile-token',
          expiresAt: new Date('2026-05-22T00:00:00.000Z'),
          sessionId: 'session-1',
        })),
        refreshSession: vi.fn(async (token: string | null) =>
          token === 'valid-token'
            ? {
                token: 'rotated-token',
                expiresAt: new Date('2026-05-22T00:00:00.000Z'),
                user: contractUser,
                session: {
                  user: contractUser,
                  expiresAt: new Date('2026-05-22T00:00:00.000Z'),
                  sessionId: 'session-1',
                  createdAt: new Date('2026-05-15T00:00:00.000Z'),
                  lastUsedAt: new Date('2026-05-15T00:00:00.000Z'),
                  deviceId: 'device-1',
                  platform: 'ios',
                  appVersion: '1.0.0',
                },
              }
            : null,
        ),
        assertDeviceMatch: vi.fn((session, deviceId) => {
          if (deviceId && session.deviceId && deviceId !== session.deviceId) {
            throw new actual.SessionDeviceMismatchError();
          }
        }),
        listActiveSessions: vi.fn(async () => [{
          id: 'session-1',
          expiresAt: new Date('2026-05-22T00:00:00.000Z'),
          createdAt: new Date('2026-05-15T00:00:00.000Z'),
          lastUsedAt: new Date('2026-05-15T00:00:00.000Z'),
          deviceId: 'device-1',
          platform: 'ios',
          appVersion: '1.0.0',
        }]),
        deleteSessionByIdForUser: vi.fn(async () => undefined),
        deleteSession: vi.fn(async () => undefined),
      })),
      hashMemberSessionToken: vi.fn((token: string) => `hash:${token}`),
    };
  });
}

export function unmockCommon() {
  vi.resetModules();
  vi.doUnmock('@shared/services/memberSessionService');
  vi.doUnmock('@shared/services/mobileAuthService');
  vi.doUnmock('@shared/services/hertzDmService');
  vi.doUnmock('@shared/services/hertzInAppNotificationService');
  vi.doUnmock('@shared/services/hertzPostService');
  vi.doUnmock('@shared/services/hertzInteractionService');
  vi.doUnmock('@shared/services/mobileMediaService');
  vi.doUnmock('@shared/services/hertzMemberProfileService');
  vi.doUnmock('@shared/services/hertzPublicProfileService');
  vi.doUnmock('@shared/services/hertzSearchService');
  vi.doUnmock('@/lib/globalDataMarket');
  vi.doUnmock('@shared/services/deviceTokenService');
  vi.doUnmock('@/server/services/auth/MobileAuthService');
  vi.doUnmock('@/lib/mobileContent');
  vi.doUnmock('@shared/services/hertzReportService');
  vi.doUnmock('@shared/services/hertzCommentService');
  vi.doUnmock('@/lib/redis');
}

export async function expectEnvelope(response: Response, status = 200) {
  const body = await response.json();
  expect(response.status).toBe(status);
  expect(body).toHaveProperty('success', status < 400);
  return body;
}

