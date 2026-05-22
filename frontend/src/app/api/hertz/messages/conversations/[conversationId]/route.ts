import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { conversationId } = await context.params;
    const after = request.nextUrl.searchParams.get('after');
    if (after) {
      if (!/^[0-9a-f-]{36}$/i.test(after)) return apiError('VALIDATION_ERROR', 'Parameter after tidak valid', 400);
      return apiSuccess(await service.threadAfter(user, conversationId, after));
    }
    return apiSuccess(await service.thread(user, conversationId));
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { conversationId } = await context.params;
    const body = await request.json();
    const message = await service.send(user, conversationId, body.body, body.attachments);
    return apiSuccess({ message }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { conversationId } = await context.params;
    const body = await request.json();
    await service.archive(user, conversationId, Boolean(body.archived));
    return apiSuccess({ archived: Boolean(body.archived) });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
