import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { appendIncrementalMessages, listMessagesAfterId } from '@/lib/dm/incremental-thread';

// Feature: hertz-social-ux-uplift, Property 7: Incremental DM poll is monotonic and append-only

describe('incremental DM thread', () => {
  it('returns messages after id and appends without duplicates', () => {
    fc.assert(fc.property(fc.array(fc.uuid(), { minLength: 1, maxLength: 50 }), fc.nat(50), (ids, rawIndex) => {
      const canonical = [...new Set(ids)].map((id, index) => ({ id, order: index }));
      const index = rawIndex % canonical.length;
      const afterId = canonical[index]?.id;
      const after = listMessagesAfterId(canonical, afterId);
      expect(after).toEqual(canonical.slice(index + 1));
      const local = canonical.slice(0, index + 1);
      const merged = appendIncrementalMessages(local, after);
      expect(merged).toEqual(canonical);
      expect(appendIncrementalMessages(merged, [])).toEqual(merged);
    }));
  });
});
