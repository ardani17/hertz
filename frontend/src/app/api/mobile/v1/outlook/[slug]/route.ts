import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/apiResponse';
import { withCache, withMobileRoute } from '@/lib/mobileApi';
import { getMobileArticle } from '@/lib/mobileContent';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'read', requireAuth: false }, async () => {
    const { slug } = await context.params;
    const result = await getMobileArticle({ category: 'outlook', slug });
    if (!result) return apiError('RESOURCE_NOT_FOUND', 'Outlook tidak ditemukan', 404);
    return withCache(apiSuccess(result), 'public, max-age=60, stale-while-revalidate=300');
  });
}
