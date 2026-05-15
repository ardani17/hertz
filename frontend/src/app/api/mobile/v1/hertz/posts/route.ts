import { NextRequest } from 'next/server';
import { HertzPostService } from '@shared/services/hertzPostService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, optionalMobileMember, withCache } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const feed = new HertzPostService();

export async function GET(request: NextRequest) {
  const limited = checkMobileRateLimit(request, 'read');
  if (limited) return limited;

  try {
    const params = request.nextUrl.searchParams;
    const viewer = await optionalMobileMember(request);
    const result = await feed.listFeed({
      cursor: params.get('cursor'),
      limit: Number(params.get('limit') || 20),
      category: params.get('category'),
      search: params.get('q'),
      sort: params.get('sort'),
      viewer,
    });
    return withCache(apiSuccess(result), viewer ? 'private, no-store' : 'public, max-age=15, stale-while-revalidate=30');
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
