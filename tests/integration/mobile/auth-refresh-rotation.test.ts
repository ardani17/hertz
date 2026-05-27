import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { SESSION_IDLE_MS } from '../../../shared/constants';

const contractUser = {
  id: 'member-1',
  telegramId: 123,
  username: 'member',
  displayName: 'Member',
  avatarUrl: null,
  role: 'member' as const,
  badge: 'verified_member' as const,
  verifiedMemberAt: '2026-05-15T00:00:00.000Z',
};

const dbUser = {
  id: 'member-1',
  telegram_id: 123,
  username: 'member',
  banned_at: null,
  role: 'member',
};

const sessionRow = {
  id: 'session-1',
  user_id: 'member-1',
  token_hash: 'hash:old-token',
  expires_at: new Date('2026-05-22T00:00:00.000Z'),
  created_at: new Date('2026-05-15T00:00:00.000Z'),
  last_used_at: new Date('2026-05-15T00:00:00.000Z'),
  device_id: 'device-1',
  platform: 'ios',
  app_version: '1.0.0',
};

let activeTokenHash = 'hash:old-token';
let rotatedToken = '';

const mockCreate = vi.fn();
const mockFindByTokenHash = vi.fn();
const mockTouchAndExtend = vi.fn();
const mockRotateTokenHash = vi.fn();
const mockDeleteByTokenHash = vi.fn();
const mockFindUserById = vi.fn();
const mockEnsureMembershipFresh = vi.fn();

vi.mock('../../../shared/repositories/memberSessionRepository', () => ({
  MemberSessionRepository: vi.fn().mockImplementation(() => ({
    create: mockCreate,
    findByTokenHash: mockFindByTokenHash,
    touchAndExtend: mockTouchAndExtend,
    rotateTokenHash: mockRotateTokenHash,
    deleteByTokenHash: mockDeleteByTokenHash,
  })),
}));

vi.mock('../../../shared/repositories/membershipRepository', () => ({
  MembershipRepository: vi.fn().mockImplementation(() => ({
    findUserById: mockFindUserById,
  })),
}));

vi.mock('../../../shared/services/membershipService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../shared/services/membershipService')>();
  return {
    ...actual,
    MembershipService: vi.fn().mockImplementation(() => ({
      ensureMembershipFresh: mockEnsureMembershipFresh,
    })),
    toMemberSessionUser: vi.fn(() => contractUser),
  };
});

import { MemberSessionService, hashMemberSessionToken } from '../../../shared/services/memberSessionService';

function mobileRequest(path: string, init: RequestInit = {}) {
  return new NextRequest(`https://example.com${path}`, {
    ...init,
    headers: {
      'x-forwarded-for': '203.0.113.10',
      ...(init.headers ?? {}),
    },
  });
}

describe('mobile auth refresh rotation integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z'));
    activeTokenHash = hashMemberSessionToken('old-token');
    rotatedToken = '';
    mockCreate.mockReset();
    mockFindByTokenHash.mockReset();
    mockTouchAndExtend.mockReset();
    mockRotateTokenHash.mockReset();
    mockDeleteByTokenHash.mockReset();
    mockFindUserById.mockReset();
    mockEnsureMembershipFresh.mockReset();
    mockFindUserById.mockResolvedValue(dbUser);
    mockEnsureMembershipFresh.mockResolvedValue(true);
    mockTouchAndExtend.mockResolvedValue(undefined);
    mockRotateTokenHash.mockImplementation(async (_sessionId: string, nextHash: string) => {
      activeTokenHash = nextHash;
    });
    mockFindByTokenHash.mockImplementation(async (tokenHash: string) =>
      tokenHash === activeTokenHash ? { ...sessionRow, token_hash: tokenHash } : null,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.doUnmock('@shared/services/memberSessionService');
    vi.doUnmock('@/server/services/auth/MobileAuthService');
  });

  it('invalidates old token and accepts rotated token at service level', async () => {
    const service = new MemberSessionService();
    const refreshed = await service.refreshSession('old-token');

    expect(refreshed?.token).toBeTruthy();
    expect(refreshed?.token).not.toBe('old-token');
    rotatedToken = refreshed!.token;
    expect(mockRotateTokenHash).toHaveBeenCalledTimes(1);

    await expect(service.validateToken('old-token')).resolves.toBeNull();
    await expect(service.validateToken(rotatedToken)).resolves.toMatchObject({
      user: expect.objectContaining({ id: 'member-1' }),
      expiresAt: expect.any(Date),
    });
    expect((await service.validateToken(rotatedToken))?.expiresAt.getTime()).toBe(Date.now() + SESSION_IDLE_MS);
  });

  it('returns 401 for old bearer and 200 for rotated bearer at route level', async () => {
    vi.resetModules();
    let currentValidToken = 'old-token';
    const validatedSession = {
      user: contractUser,
      expiresAt: new Date('2026-05-22T00:00:00.000Z'),
      sessionId: 'session-1',
      createdAt: new Date('2026-05-15T00:00:00.000Z'),
      lastUsedAt: new Date('2026-05-15T00:00:00.000Z'),
      deviceId: 'device-1',
      platform: 'ios',
      appVersion: '1.0.0',
    };

    vi.doMock('@shared/services/memberSessionService', async () => {
      const actual = await vi.importActual<typeof import('../../../shared/services/memberSessionService')>('@shared/services/memberSessionService');
      return {
        ...actual,
        MemberSessionService: vi.fn().mockImplementation(() => ({
          validateToken: vi.fn(async (token: string | null) =>
            token === currentValidToken ? validatedSession : null,
          ),
          refreshSession: vi.fn(async (token: string | null) => {
            if (token !== currentValidToken) return null;
            currentValidToken = 'rotated-token';
            return {
              token: 'rotated-token',
              expiresAt: validatedSession.expiresAt,
              user: contractUser,
              session: validatedSession,
            };
          }),
          assertDeviceMatch: vi.fn(() => undefined),
        })),
      };
    });
    vi.doMock('@/server/services/auth/MobileAuthService', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../frontend/src/server/services/auth/MobileAuthService')>();
      return {
        ...actual,
        MobileAuthService: vi.fn().mockImplementation(() => ({
          buildMe: vi.fn(async () => ({
            user: contractUser,
            notifications: { unreadCount: 0, hasUnread: false, unreadDmCount: 0, hasUnreadDm: false },
            session: { id: 'session-1', deviceId: 'device-1', platform: 'ios', appVersion: '1.0.0', expiresAt: '2026-05-22T00:00:00.000Z', createdAt: '2026-05-15T00:00:00.000Z', lastUsedAt: null, current: true },
          })),
        })),
      };
    });

    const { POST: refreshRoute } = await import('../../../frontend/src/app/api/mobile/v1/auth/refresh/route');
    const refreshResponse = await refreshRoute(mobileRequest('/api/mobile/v1/auth/refresh', {
      method: 'POST',
      headers: { authorization: 'Bearer old-token' },
      body: JSON.stringify({ deviceId: 'device-1' }),
    }));
    const refreshBody = await refreshResponse.json();
    expect(refreshResponse.status).toBe(200);
    expect(refreshBody.data.token).toBe('rotated-token');

    const { GET: meRoute } = await import('../../../frontend/src/app/api/mobile/v1/me/route');
    const oldMeResponse = await meRoute(mobileRequest('/api/mobile/v1/me', {
      headers: { authorization: 'Bearer old-token' },
    }));
    expect(oldMeResponse.status).toBe(401);

    const newMeResponse = await meRoute(mobileRequest('/api/mobile/v1/me', {
      headers: { authorization: 'Bearer rotated-token' },
    }));
    const newMeBody = await newMeResponse.json();
    expect(newMeResponse.status).toBe(200);
    expect(newMeBody.data.user.id).toBe('member-1');
  });
});
