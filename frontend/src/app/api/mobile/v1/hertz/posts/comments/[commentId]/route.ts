import { NextRequest } from 'next/server';
import { HertzCommentService } from '@shared/services/hertzCommentService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ commentId: string }>;
}

const comments = new HertzCommentService();

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { commentId } = await context.params;
    await comments.delete(commentId, auth.user);
    return apiSuccess({ deleted: true });
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { commentId } = await context.params;
    const body = await request.json();
    await comments.edit(commentId, auth.user, body.content);
    return apiSuccess({ updated: true });
  });
}
