import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ messageId: string }>;
}

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { messageId } = await context.params;
    await service.deleteMessage(user, messageId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { messageId } = await context.params;
    const body = await request.json();
    await service.report(user, messageId, body.reason, body.details);
    return apiSuccess({ reported: true }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
