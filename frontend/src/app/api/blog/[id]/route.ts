import { NextRequest } from 'next/server';
import { HertzBlogService } from '@shared/services/hertzBlogService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

const service = new HertzBlogService();

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { id } = await context.params;
    await service.update(user, id, await request.json());
    return apiSuccess({ updated: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { id } = await context.params;
    await service.delete(user, id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { id } = await context.params;
    const body = await request.json();
    await service.report(user, id, body.reason);
    return apiSuccess({ reported: true }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
