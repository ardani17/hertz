import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/apiResponse';
import { withCache, withMobileRoute } from '@/lib/mobileApi';
import { listMobileGallery } from '@/lib/mobileContent';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read', requireAuth: false }, async () => {
    const params = request.nextUrl.searchParams;
    const result = await listMobileGallery({
      limit: params.get('limit'),
      offset: params.get('offset'),
    });
    return withCache(apiSuccess(result), 'public, max-age=60, stale-while-revalidate=300');
  });
}
