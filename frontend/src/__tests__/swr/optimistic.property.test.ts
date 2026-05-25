import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { mergeOptimisticList, rollbackOptimisticValue } from '@/lib/swr/optimistic';

// Feature: hertz-social-ux-uplift, Property 1: Optimistic merge round-trip

describe('optimistic helpers', () => {
  it('merges optimistic entities idempotently and reconciles canonical ids', () => {
    fc.assert(
      fc.property(fc.array(fc.uuid(), { maxLength: 30 }), fc.uuid(), fc.uuid(), (ids, tempId, canonicalId) => {
        const base = [...new Set(ids)].map((id) => ({ id, value: id }));
        const once = mergeOptimisticList(base, { id: tempId, value: 'temp' });
        const twice = mergeOptimisticList(once, { id: tempId, value: 'temp' });
        expect(twice.filter((item) => item.id === tempId)).toHaveLength(1);
        const reconciled = mergeOptimisticList(twice, { id: canonicalId, value: 'server' }, { optimisticId: tempId });
        expect(reconciled.some((item) => item.id === tempId)).toBe(false);
        expect(reconciled.filter((item) => item.id === canonicalId)).toHaveLength(1);
      }),
    );
  });

  it('rolls back to exact previous value', () => {
    fc.assert(fc.property(fc.jsonValue(), (value) => {
      expect(rollbackOptimisticValue(value)).toEqual(value);
    }));
  });
});
