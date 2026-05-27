import { NextRequest } from 'next/server';
import { HertzPostService } from '@shared/services/hertzPostService';
import { apiSuccess } from '@/lib/apiResponse';
import {
  withCache,
  withMobileRoute,
} from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

export const dynamic = 'force-dynamic';

const feed = new HertzPostService();

export async function GET(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'read', requireAuth: false }, async ({ viewer }) => {
    const { shortId } = await context.params;
    const post = await feed.getPostDetail(shortId, viewer);
    return withCache(apiSuccess({ post }), viewer ? 'private, no-store' : 'public, max-age=30, stale-while-revalidate=60');
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { shortId } = await context.params;
    const body = await request.json();
    if (typeof body.content === 'string') {
      await feed.editPost(shortId, auth.user, body.content);
    }
    if ('market' in body) {
      await feed.updateMarketContext(shortId, auth.user, body.market ?? null);
    }
    return apiSuccess({ updated: true });
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { shortId } = await context.params;
    await feed.deletePost(shortId, auth.user);
    return apiSuccess({ deleted: true });
  });
}
