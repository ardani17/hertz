import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { resolveVisibilityRefreshInterval } from '@/lib/swr/visibility';

// Feature: hertz-social-ux-uplift, Property 3: Visibility-pause invariant

describe('visibility refresh interval', () => {
  it('pauses interval while hidden and restores configured interval while visible', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 60_000 }), fc.boolean(), (interval, hidden) => {
      expect(resolveVisibilityRefreshInterval(interval, hidden ? 'hidden' : 'visible')).toBe(hidden ? 0 : interval);
    }));
  });
});
