import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { userId } = await context.params;
    await service.block(user, userId, true);
    return apiSuccess({ blocked: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { userId } = await context.params;
    await service.block(user, userId, false);
    return apiSuccess({ blocked: false });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
