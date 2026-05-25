import { NextRequest } from 'next/server';
import { HertzPostService } from '@shared/services/hertzPostService';
import { checkRateLimit } from '@/lib/rateLimit';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const feed = new HertzPostService();

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const viewer = await getCurrentMember();
    const author = params.get('author')?.trim();
    const authorId = params.get('authorId')?.trim();

    if (author || authorId) {
      const resolvedAuthorId = authorId || (author ? await feed.resolvePublishedAuthorId(author) : null);
      if (!resolvedAuthorId) {
        return apiSuccess({ items: [], nextCursor: null });
      }
      const result = await feed.listAuthorFeed({
        authorId: resolvedAuthorId,
        cursor: params.get('cursor'),
        limit: Number(params.get('limit') || 20),
        viewer,
      });
      return apiSuccess(result);
    }

    const result = await feed.listFeed({
      cursor: params.get('cursor'),
      limit: Number(params.get('limit') || 20),
      category: params.get('category'),
      search: params.get('q'),
      sort: params.get('sort'),
      viewer,
    });
    return apiSuccess(result);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, { max: 10, windowMs: 60 * 60 * 1000, prefix: 'hertz-post' });
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json();
    const post = await feed.createWebPost(user, body);
    return apiSuccess({ post }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
