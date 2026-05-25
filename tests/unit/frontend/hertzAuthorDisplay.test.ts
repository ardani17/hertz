import { describe, expect, it } from 'vitest';
import { formatHertzAuthorHandle } from '@/lib/hertzAuthorDisplay';

describe('formatHertzAuthorHandle', () => {
  it('formats author username as a social handle', () => {
    expect(formatHertzAuthorHandle('hertz_trader')).toBe('@hertz_trader');
  });

  it('keeps an existing @ prefix singular', () => {
    expect(formatHertzAuthorHandle('@hertz_trader')).toBe('@hertz_trader');
  });

  it('falls back to a neutral member handle when username is missing', () => {
    expect(formatHertzAuthorHandle(null)).toBe('@member');
    expect(formatHertzAuthorHandle('')).toBe('@member');
  });
});
