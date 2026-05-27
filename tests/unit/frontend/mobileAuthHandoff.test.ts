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
    vi.doUnmock('@shared/services/mobileAuthService');
  });

  it('creates a login handoff nonce', async () => {
    vi.doMock('@shared/services/mobileAuthService', () => ({
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
    vi.doMock('@shared/services/mobileAuthService', () => ({
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

