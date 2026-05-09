import { NextRequest } from 'next/server';
import { HertzCommentService } from '@shared/services/hertzCommentService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ commentId: string }>;
}

const comments = new HertzCommentService();

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { commentId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json();
    await comments.edit(commentId, user, body.content);
    return apiSuccess({ updated: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { commentId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    await comments.delete(commentId, user);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
