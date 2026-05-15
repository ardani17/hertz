import { NextRequest } from 'next/server';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, withCache } from '@/lib/mobileApi';
import { listMobileArticles } from '@/lib/mobileContent';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = checkMobileRateLimit(request, 'read');
  if (limited) return limited;

  try {
    const params = request.nextUrl.searchParams;
    const result = await listMobileArticles({
      category: 'outlook',
      limit: params.get('limit'),
      offset: params.get('offset'),
      search: params.get('q'),
    });
    return withCache(apiSuccess(result), 'public, max-age=60, stale-while-revalidate=300');
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
