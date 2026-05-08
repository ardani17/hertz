import { NextRequest } from 'next/server';
import { PostBookmarkService } from '@shared/services/postBookmarkService';
import { checkRateLimit } from '@/lib/rateLimit';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ postId: string }>;
}

const service = new PostBookmarkService();

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = checkRateLimit(request, { max: 120, windowMs: 10 * 60 * 1000, prefix: 'bookmark-toggle' });
  if (rateLimited) return rateLimited;
  try {
    const { postId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const result = await service.toggleBookmark(postId, user);
    return apiSuccess(result);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
