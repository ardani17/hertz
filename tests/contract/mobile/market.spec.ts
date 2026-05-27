import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, request, unmockCommon } from './helpers';

describe('mobile market rail contract', () => {
  afterEach(unmockCommon);

  it('returns market rail snapshot envelope', async () => {
    vi.doMock('@/lib/globalDataMarket', () => ({
      getMarketRailSnapshot: vi.fn(async () => ({ groups: [{ label: 'FX', items: [] }], cacheTtlSeconds: 30 })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/market/rail/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/market/rail')));
    expect(body.data.groups[0].label).toBe('FX');
  });
});

