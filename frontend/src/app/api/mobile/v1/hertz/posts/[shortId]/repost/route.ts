import { NextRequest } from 'next/server';
import { HertzRepostService } from '@shared/services/hertzInteractionService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const service = new HertzRepostService();

export async function POST(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { shortId } = await context.params;
    const body = await request.json();
    const result = await service.repost(shortId, auth.user, body);
    return apiSuccess(result, 'post' in result ? 201 : 200);
  });
}

