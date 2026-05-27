import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ messageId: string }>;
}

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { messageId } = await context.params;
    await service.deleteMessage(auth.user, messageId);
    return apiSuccess({ deleted: true });
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { messageId } = await context.params;
    const body = await request.json();
    await service.report(auth.user, messageId, body.reason, body.details);
    return apiSuccess({ reported: true }, 201);
  });
}

