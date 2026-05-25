import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createDedupeFetcher } from '@/lib/swr/dedupe';

// Feature: hertz-social-ux-uplift, Property 2: SWR dedupe across consumers

describe('createDedupeFetcher', () => {
  it('deduplicates overlapping requests with the same key', async () => {
    await fc.assert(fc.asyncProperty(fc.string({ minLength: 1 }), fc.integer({ min: 2, max: 8 }), async (key, consumers) => {
      let calls = 0;
      const fetcher = createDedupeFetcher(async (requestKey: string) => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 1));
        return `value:${requestKey}`;
      });
      const values = await Promise.all(Array.from({ length: consumers }, () => fetcher(key)));
      expect(values).toEqual(Array.from({ length: consumers }, () => `value:${key}`));
      expect(calls).toBe(1);
    }));
  });
});
