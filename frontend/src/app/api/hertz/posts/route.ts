import { NextRequest } from 'next/server';
import { FeedService } from '@shared/services/feedService';
import { checkRateLimit } from '@/lib/rateLimit';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const feed = new FeedService();

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const viewer = await getCurrentMember();
    const result = await feed.listFeed({
      cursor: params.get('cursor'),
      limit: Number(params.get('limit') || 20),
      category: params.get('category'),
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
