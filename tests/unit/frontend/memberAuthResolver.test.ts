import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMBER_SESSION_COOKIE } from '../../../shared/types/membership';

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

const validateTokenMock = vi.fn();

vi.mock('@shared/services/memberSessionService', () => ({
  MemberSessionService: vi.fn().mockImplementation(() => ({
    validateToken: (...args: unknown[]) => validateTokenMock(...args),
  })),
}));

import { resolveCurrentMemberFromRequest } from '../../../frontend/src/lib/memberAuth';

describe('member auth request resolver', () => {
  beforeEach(() => {
    validateTokenMock.mockReset();
  });

  it('uses a valid cookie before checking bearer auth', async () => {
    validateTokenMock.mockImplementation(async (token: string | null) =>
      token === 'cookie-token' ? { user, expiresAt: new Date('2026-05-16T12:00:00.000Z') } : null,
    );
    const request = new NextRequest('https://example.com/api/test', {
      headers: {
        authorization: 'Bearer bearer-token',
        cookie: `${MEMBER_SESSION_COOKIE}=cookie-token`,
      },
    });

    const result = await resolveCurrentMemberFromRequest(request);

    expect(result).toMatchObject({ user, token: 'cookie-token', source: 'cookie' });
    expect(validateTokenMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to bearer auth when the cookie is invalid', async () => {
    validateTokenMock.mockImplementation(async (token: string | null) =>
      token === 'bearer-token' ? { user, expiresAt: new Date('2026-05-16T12:00:00.000Z') } : null,
    );
    const request = new NextRequest('https://example.com/api/test', {
      headers: {
        authorization: 'Bearer bearer-token',
        cookie: `${MEMBER_SESSION_COOKIE}=expired-cookie`,
      },
    });

    const result = await resolveCurrentMemberFromRequest(request);

    expect(result).toMatchObject({ user, token: 'bearer-token', source: 'bearer' });
    expect(validateTokenMock).toHaveBeenNthCalledWith(1, 'expired-cookie');
    expect(validateTokenMock).toHaveBeenNthCalledWith(2, 'bearer-token');
  });

  it('rejects malformed bearer auth', async () => {
    validateTokenMock.mockResolvedValue(null);
    const request = new NextRequest('https://example.com/api/test', {
      headers: { authorization: 'Bearer token with spaces' },
    });

    const result = await resolveCurrentMemberFromRequest(request);

    expect(result).toEqual({ user: null, token: null, source: null });
    expect(validateTokenMock).toHaveBeenCalledTimes(2);
  });
});
