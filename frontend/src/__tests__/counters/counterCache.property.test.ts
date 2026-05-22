import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyCounterEvents } from '@shared/repositories/hertzPostStatsRepository';

// Feature: horizon-social-ux-uplift, Property 8: Counter cache idempotency and correctness

describe('counter cache event reducer', () => {
  it('is idempotent by event id and clamps non-negative counters', () => {
    fc.assert(fc.property(
      fc.array(fc.record({ eventId: fc.uuid(), field: fc.constantFrom('comment_count', 'pulse_count', 'repost_count', 'view_count'), delta: fc.integer({ min: -3, max: 5 }) }), { maxLength: 80 }),
      (events) => {
        const once = applyCounterEvents({ comment_count: 0, pulse_count: 0, repost_count: 0, view_count: 0 }, events);
        const twice = applyCounterEvents({ comment_count: 0, pulse_count: 0, repost_count: 0, view_count: 0 }, [...events, ...events]);
        expect(twice.counts).toEqual(once.counts);
        expect(Object.values(once.counts).every((value) => value >= 0)).toBe(true);
      },
    ));
  });
});
