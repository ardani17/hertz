import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

async function loadResolver(validateToken: (token: string | null) => unknown) {
  vi.resetModules();
  vi.doMock('@shared/services/memberSessionService', () => ({
    MemberSessionService: vi.fn().mockImplementation(() => ({
      validateToken: vi.fn(validateToken),
    })),
  }));
  return import('../../../frontend/src/lib/memberAuth');
}

describe('member auth request resolver', () => {
  afterEach(() => {
    vi.doUnmock('@shared/services/memberSessionService');
  });

  it('uses a valid cookie before checking bearer auth', async () => {
    const validateToken = vi.fn(async (token: string | null) => (token === 'cookie-token' ? user : null));
    const { resolveCurrentMemberFromRequest } = await loadResolver(validateToken);
    const request = new NextRequest('https://example.com/api/test', {
      headers: {
        authorization: 'Bearer bearer-token',
        cookie: `${MEMBER_SESSION_COOKIE}=cookie-token`,
      },
    });

    const result = await resolveCurrentMemberFromRequest(request);

    expect(result).toMatchObject({ user, token: 'cookie-token', source: 'cookie' });
    expect(validateToken).toHaveBeenCalledTimes(1);
  });

  it('falls back to bearer auth when the cookie is invalid', async () => {
    const validateToken = vi.fn(async (token: string | null) => (token === 'bearer-token' ? user : null));
    const { resolveCurrentMemberFromRequest } = await loadResolver(validateToken);
    const request = new NextRequest('https://example.com/api/test', {
      headers: {
        authorization: 'Bearer bearer-token',
        cookie: `${MEMBER_SESSION_COOKIE}=expired-cookie`,
      },
    });

    const result = await resolveCurrentMemberFromRequest(request);

    expect(result).toMatchObject({ user, token: 'bearer-token', source: 'bearer' });
    expect(validateToken).toHaveBeenNthCalledWith(1, 'expired-cookie');
    expect(validateToken).toHaveBeenNthCalledWith(2, 'bearer-token');
  });

  it('rejects malformed bearer auth', async () => {
    const validateToken = vi.fn(async () => null);
    const { resolveCurrentMemberFromRequest } = await loadResolver(validateToken);
    const request = new NextRequest('https://example.com/api/test', {
      headers: { authorization: 'Bearer token with spaces' },
    });

    const result = await resolveCurrentMemberFromRequest(request);

    expect(result).toEqual({ user: null, token: null, source: null });
    expect(validateToken).toHaveBeenCalledTimes(2);
  });
});
