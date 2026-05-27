import { NextRequest } from 'next/server';
import { HertzPostService } from '@shared/services/hertzPostService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import {
  checkMobileRateLimit,
  isMobileAuthContext,
  optionalMobileMember,
  requireMobileMember,
  withCache,
} from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const feed = new HertzPostService();

export async function GET(request: NextRequest) {
  const limited = checkMobileRateLimit(request, 'read');
  if (limited) return limited;

  try {
    const params = request.nextUrl.searchParams;
    const viewer = await optionalMobileMember(request);
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
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const post = await feed.createWebPost(auth.user, await request.json());
    return apiSuccess({ post }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
