import { NextRequest } from 'next/server';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, withCache } from '@/lib/mobileApi';
import { listMobileGallery } from '@/lib/mobileContent';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await checkMobileRateLimit(request, 'read');
  if (limited) return limited;

  try {
    const params = request.nextUrl.searchParams;
    const result = await listMobileGallery({
      limit: params.get('limit'),
      offset: params.get('offset'),
    });
    return withCache(apiSuccess(result), 'public, max-age=60, stale-while-revalidate=300');
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
