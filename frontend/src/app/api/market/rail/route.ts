import { NextResponse } from 'next/server';
import { apiError } from '@/lib/apiResponse';
import { MarketRailService } from '@/server/services/market/MarketRailService';

export const dynamic = 'force-dynamic';

const marketRail = new MarketRailService();

export async function GET() {
  const snapshot = await marketRail.snapshot();
  if (snapshot.groups.length === 0) {
    return apiError('RESOURCE_NOT_FOUND', 'Data market belum tersedia', 503);
  }
  return NextResponse.json(
    { success: true, data: snapshot },
    {
      headers: {
        'Cache-Control': `private, max-age=${snapshot.cacheTtlSeconds}, stale-while-revalidate=${snapshot.cacheTtlSeconds}`,
      },
    },
  );
}
