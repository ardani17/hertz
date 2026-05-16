import { NextResponse } from 'next/server';
import { apiError } from '@/lib/apiResponse';
import { getMarketRailSnapshot } from '@/lib/globalDataMarket';

export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = await getMarketRailSnapshot();
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
