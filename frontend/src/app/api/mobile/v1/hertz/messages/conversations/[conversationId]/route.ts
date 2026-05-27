import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiError, apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function GET(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'read' }, async ({ auth }) => {
    const { conversationId } = await context.params;
    const after = request.nextUrl.searchParams.get('after');
    return apiSuccess(after
      ? await service.threadAfter(auth.user, conversationId, after)
      : await service.thread(auth.user, conversationId));
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { conversationId } = await context.params;
    const body = await request.json();
    const message = await service.send(auth.user, conversationId, body.content ?? body.body, body.attachments ?? body.attachmentIds ?? []);
    return apiSuccess({ message }, 201);
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { conversationId } = await context.params;
    const body = await request.json().catch(() => ({}));
    if (typeof body.archived !== 'boolean') return apiError('VALIDATION_ERROR', 'archived wajib boolean', 400);
    await service.archive(auth.user, conversationId, body.archived);
    return apiSuccess({ archived: body.archived });
  });
}

