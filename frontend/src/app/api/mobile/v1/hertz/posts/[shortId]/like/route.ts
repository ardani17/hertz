import { NextRequest } from 'next/server';
import { HertzReactionService } from '@shared/services/hertzInteractionService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const reactions = new HertzReactionService();

export async function POST(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { shortId } = await context.params;
    const result = await reactions.togglePulse(shortId, auth.user);
    return apiSuccess({ liked: result.active, active: result.active });
  });
}
