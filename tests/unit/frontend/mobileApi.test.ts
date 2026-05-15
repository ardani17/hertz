import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { parseBearerToken } from '../../../frontend/src/lib/memberAuth';
import { checkMobileRateLimit, tokenFingerprint } from '../../../frontend/src/lib/mobileApi';

describe('mobile member auth helpers', () => {
  it('parses valid bearer authorization headers', () => {
    expect(parseBearerToken('Bearer session-token')).toBe('session-token');
    expect(parseBearerToken('bearer session-token')).toBe('session-token');
  });

  it('rejects malformed authorization headers', () => {
    expect(parseBearerToken(null)).toBeNull();
    expect(parseBearerToken('Basic token')).toBeNull();
    expect(parseBearerToken('Bearer')).toBeNull();
    expect(parseBearerToken('Bearer token with spaces')).toBeNull();
  });

  it('fingerprints tokens without returning the raw token', () => {
    const token = 'raw-mobile-session-token';
    const fingerprint = tokenFingerprint(token);

    expect(fingerprint).toHaveLength(24);
    expect(fingerprint).not.toBe(token);
  });
});

describe('mobile API rate limit', () => {
  it('returns the standard envelope when a mobile auth limit is exceeded', async () => {
    const request = new NextRequest('https://example.com/api/mobile/v1/auth/telegram', {
      headers: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 100)}` },
    });
    let response: Response | null = null;

    for (let i = 0; i < 13; i++) {
      response = checkMobileRateLimit(request, 'auth');
    }

    expect(response?.status).toBe(429);
    await expect(response?.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        error_code: 'RATE_LIMITED',
      },
    });
  });

  it('rate limits a mobile mutation policy with the standard envelope', async () => {
    const identity = `member-${Math.random()}`;
    const request = new NextRequest('https://example.com/api/mobile/v1/hertz/posts/hz_test/like', {
      method: 'POST',
      headers: { authorization: 'Bearer mutation-token' },
    });
    let response: Response | null = null;

    for (let i = 0; i < 61; i++) {
      response = checkMobileRateLimit(request, 'mutation', identity);
    }

    expect(response?.status).toBe(429);
    await expect(response?.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        error_code: 'RATE_LIMITED',
      },
    });
  });
});
