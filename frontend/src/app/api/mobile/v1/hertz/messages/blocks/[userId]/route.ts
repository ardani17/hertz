import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function POST(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { userId } = await context.params;
    await service.block(auth.user, userId, true);
    return apiSuccess({ blocked: true });
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { userId } = await context.params;
    await service.block(auth.user, userId, false);
    return apiSuccess({ blocked: false });
  });
}

