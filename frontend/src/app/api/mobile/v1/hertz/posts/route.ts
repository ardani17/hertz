import { NextRequest } from 'next/server';
import { HertzPostService } from '@shared/services/hertzPostService';
import { apiSuccess } from '@/lib/apiResponse';
import {
  withCache,
  withMobileRoute,
} from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const feed = new HertzPostService();

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read', requireAuth: false }, async ({ viewer }) => {
    const params = request.nextUrl.searchParams;
    const author = params.get('author')?.trim();
    const authorId = params.get('authorId')?.trim();
    if (author || authorId) {
      const resolvedAuthorId = authorId || (author ? await feed.resolvePublishedAuthorId(author) : null);
      if (!resolvedAuthorId) return apiSuccess({ items: [], nextCursor: null });
      const result = await feed.listAuthorFeed({
        authorId: resolvedAuthorId,
        cursor: params.get('cursor'),
        limit: Number(params.get('limit') || 20),
        viewer,
      });
      return withCache(apiSuccess(result), viewer ? 'private, no-store' : 'public, max-age=15, stale-while-revalidate=30');
    }
    const result = await feed.listFeed({
      cursor: params.get('cursor'),
      limit: Number(params.get('limit') || 20),
      category: params.get('category'),
      search: params.get('q'),
      sort: params.get('sort'),
      viewer,
    });
    return withCache(apiSuccess(result), viewer ? 'private, no-store' : 'public, max-age=15, stale-while-revalidate=30');
  });
}

export async function POST(request: NextRequest) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const post = await feed.createWebPost(auth.user, await request.json());
    return apiSuccess({ post }, 201);
  });
}
