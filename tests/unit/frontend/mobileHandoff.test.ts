import { describe, expect, it } from 'vitest';
import { buildMobileAuthCallbackUrl, resolveMobileDeepLinkScheme } from '../../../frontend/src/lib/mobileHandoff';

describe('mobileHandoff', () => {
  it('falls back to hertz when scheme is empty', () => {
    expect(resolveMobileDeepLinkScheme(undefined)).toBe('hertz');
    expect(resolveMobileDeepLinkScheme('')).toBe('hertz');
  });

  it('uses custom scheme from env', () => {
    expect(resolveMobileDeepLinkScheme('myapp')).toBe('myapp');
  });

  it('builds callback deep link with token and expiry', () => {
    expect(buildMobileAuthCallbackUrl('myapp', { token: 'abc', expiresAt: '2026-05-27T00:00:00.000Z' }))
      .toBe('myapp://auth/callback?token=abc&expiresAt=2026-05-27T00%3A00%3A00.000Z');
  });
});
