import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createTypingThrottleSchedule, filterActiveTypingStatuses, TYPING_TTL_MS } from '@/lib/typing/typing-utils';

// Feature: hertz-social-ux-uplift, Property 4: Typing throttle bound
// Feature: hertz-social-ux-uplift, Property 5: Typing TTL filter

describe('typing throttle and TTL', () => {
  it('emits no more often than 1.5s and no less often than 2s while active', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 20_000 }), { minLength: 1, maxLength: 80 }), (rawTimes) => {
        const times = [...new Set(rawTimes)].sort((a, b) => a - b);
        const emitted = createTypingThrottleSchedule(times);
        for (let index = 1; index < emitted.length; index += 1) {
          const delta = emitted[index] - emitted[index - 1];
          expect(delta).toBeGreaterThanOrEqual(1500);
        }
        for (const time of times) {
          const last = emitted.filter((value) => value <= time).at(-1);
          if (last !== undefined && time - last >= 2000) {
            const next = emitted.find((value) => value >= time);
            expect(next).toBeDefined();
            expect(next! - time).toBeLessThanOrEqual(0);
          }
        }
      }),
    );
  });

  it('filters expired and self typing statuses', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ userId: fc.uuid(), displayName: fc.string({ minLength: 1, maxLength: 20 }), lastTypingAt: fc.integer({ min: 0, max: 20_000 }) }), { maxLength: 40 }),
        fc.integer({ min: 5_000, max: 20_000 }),
        fc.uuid(),
        (statuses, now, selfUserId) => {
          const filtered = filterActiveTypingStatuses(statuses, { now, selfUserId });
          expect(filtered.every((item) => item.userId !== selfUserId)).toBe(true);
          expect(filtered.every((item) => now - item.lastTypingAt <= TYPING_TTL_MS)).toBe(true);
          expect(filtered.every((item) => now >= item.lastTypingAt)).toBe(true);
        },
      ),
    );
  });
});
