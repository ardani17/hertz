import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { mapPublicProfileDto, parsePublicProfileSegment } from '@/lib/public-profile/public-profile';

// Feature: horizon-social-ux-uplift, Property 9: Public profile DTO whitelist
// Feature: horizon-social-ux-uplift, Property 10: Segment parser

describe('public profile helpers', () => {
  it('accepts @username segments and rejects unsafe segments', () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const parsed = parsePublicProfileSegment(value);
        let decoded = value;
        try {
          decoded = decodeURIComponent(value.trim());
        } catch {
          decoded = value.trim();
        }
        if (/^@[a-zA-Z0-9_\.]{2,32}$/.test(decoded)) {
          expect(parsed).toBe(decoded.slice(1).toLowerCase());
        } else if (/^[a-zA-Z0-9_\.]{2,32}$/.test(decoded) && !['admin', 'api', 'hertz', 'blog'].includes(decoded.toLowerCase())) {
          expect(parsed).toBe(decoded.toLowerCase());
        } else {
          expect(parsed).toBeNull();
        }
      }),
    );
  });

  it('decodes percent-encoded @ from Next.js dynamic segments', () => {
    expect(parsePublicProfileSegment('%40Candra333')).toBe('candra333');
    expect(parsePublicProfileSegment('@Candra333')).toBe('candra333');
    expect(parsePublicProfileSegment('Candra333')).toBe('candra333');
    expect(parsePublicProfileSegment('%40hertz')).toBeNull();
  });

  it('only exposes safe public DTO fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(), username: fc.option(fc.string({ minLength: 2, maxLength: 20 }), { nil: null }),
          displayName: fc.string({ minLength: 1, maxLength: 40 }),
          avatarUrl: fc.option(fc.webUrl(), { nil: null }), bio: fc.option(fc.string({ maxLength: 120 }), { nil: null }),
          email: fc.emailAddress(), role: fc.constantFrom('member', 'admin'), passwordHash: fc.string(),
        }),
        (row) => {
          const dto = mapPublicProfileDto(row, { postCount: 3, pulseCount: 7 });
          expect(Object.keys(dto).sort()).toEqual(['avatarUrl', 'bio', 'counters', 'displayName', 'id', 'username'].sort());
          expect(dto).not.toHaveProperty('email');
          expect(dto).not.toHaveProperty('passwordHash');
          expect(dto).not.toHaveProperty('role');
        },
      ),
    );
  });
});
