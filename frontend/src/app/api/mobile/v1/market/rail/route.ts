import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/apiResponse';
import { withCache, withMobileRoute } from '@/lib/mobileApi';
import { MarketRailService } from '@/server/services/market/MarketRailService';

export const dynamic = 'force-dynamic';

const marketRail = new MarketRailService();

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read', requireAuth: false }, async () => {
    const snapshot = await marketRail.snapshot();
    if (snapshot.groups.length === 0) {
      return apiError('RESOURCE_NOT_FOUND', 'Data market belum tersedia', 503);
    }
    return withCache(
      apiSuccess(snapshot),
      `private, max-age=${snapshot.cacheTtlSeconds}, stale-while-revalidate=${snapshot.cacheTtlSeconds}`,
    );
  });
}

