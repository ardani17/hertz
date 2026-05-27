import { NextRequest } from 'next/server';
import { HertzBookmarkService } from '@shared/services/hertzInteractionService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const service = new HertzBookmarkService();

export async function POST(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { shortId } = await context.params;
    const result = await service.toggleBookmark(shortId, auth.user);
    return apiSuccess({ ...result, bookmarked: result.active });
  });
}

