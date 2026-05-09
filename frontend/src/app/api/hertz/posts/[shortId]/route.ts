import { NextRequest } from 'next/server';
import { FeedService } from '@shared/services/feedService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

export const dynamic = 'force-dynamic';

const feed = new FeedService();

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { shortId } = await context.params;
    const viewer = await getCurrentMember();
    const post = await feed.getPostDetail(shortId, viewer);
    return apiSuccess({ post });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { shortId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json();
    if (typeof body.content === 'string') {
      await feed.editPost(shortId, user, body.content);
    }
    if ('market' in body) {
      await feed.updateMarketContext(shortId, user, body.market ?? null);
    }
    return apiSuccess({ updated: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { shortId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    await feed.deletePost(shortId, user);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
