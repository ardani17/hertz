import { NextRequest } from 'next/server';
import { HertzSearchService, type HertzSearchType } from '@shared/services/hertzSearchService';
import { apiError, apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzSearchService();

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read', requireAuth: false }, async () => {
    const type = request.nextUrl.searchParams.get('type');
    if (type && type !== 'post' && type !== 'member') {
      return apiError('VALIDATION_ERROR', 'Parameter type harus post atau member', 400);
    }
    return apiSuccess(await service.search(request.nextUrl.searchParams.get('q'), type as HertzSearchType | null));
  });
}

