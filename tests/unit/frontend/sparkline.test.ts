import { describe, expect, it } from 'vitest';
import { getSparklineDomain, toSparklineData } from '@/components/feed/Sparkline';

describe('Sparkline helpers', () => {
  it('keeps finite points and falls back when data is too short', () => {
    expect(toSparklineData([1, Number.NaN, 2])).toEqual([{ value: 1 }, { value: 2 }]);
    expect(toSparklineData([1])).toHaveLength(7);
  });

  it('creates a visible min/max domain around market data', () => {
    const domain = getSparklineDomain([77928.39, 78200, 79155.54]);

    expect(domain[0]).toBeLessThan(77928.39);
    expect(domain[1]).toBeGreaterThan(79155.54);
    expect(domain[0]).toBeGreaterThan(0);
  });

  it('creates a non-zero domain for flat data', () => {
    const domain = getSparklineDomain([100, 100, 100]);

    expect(domain[0]).toBeLessThan(100);
    expect(domain[1]).toBeGreaterThan(100);
  });
});
