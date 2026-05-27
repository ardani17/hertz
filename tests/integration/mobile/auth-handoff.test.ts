import { describe, expect, it } from 'vitest';
import { buildMobileAuthCallbackUrl } from '../../../frontend/src/lib/mobileHandoff';
import { MemberSessionService } from '../../../shared/services/memberSessionService';

describe('mobile auth integration wiring', () => {
  it('builds deep link callback for handoff redirect', () => {
    expect(buildMobileAuthCallbackUrl('hertz', { token: 'abc', expiresAt: '2026-05-27T00:00:00.000Z' }))
      .toContain('hertz://auth/callback');
  });

  it('exposes refreshSession for token rotation flow', () => {
    expect(typeof MemberSessionService.prototype.refreshSession).toBe('function');
  });
});
