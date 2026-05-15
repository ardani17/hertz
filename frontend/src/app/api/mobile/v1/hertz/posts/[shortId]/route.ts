import { NextRequest } from 'next/server';
import { HertzPostService } from '@shared/services/hertzPostService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, optionalMobileMember, withCache } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

export const dynamic = 'force-dynamic';

const feed = new HertzPostService();

export async function GET(request: NextRequest, context: RouteContext) {
  const limited = checkMobileRateLimit(request, 'read');
  if (limited) return limited;

  try {
    const { shortId } = await context.params;
    const viewer = await optionalMobileMember(request);
    const post = await feed.getPostDetail(shortId, viewer);
    return withCache(apiSuccess({ post }), viewer ? 'private, no-store' : 'public, max-age=30, stale-while-revalidate=60');
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
