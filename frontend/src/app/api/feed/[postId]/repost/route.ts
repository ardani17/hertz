import { NextRequest } from 'next/server';
import { PostRepostService } from '@shared/services/postRepostService';
import { checkRateLimit } from '@/lib/rateLimit';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ postId: string }>;
}

const service = new PostRepostService();

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = checkRateLimit(request, { max: 30, windowMs: 60 * 60 * 1000, prefix: 'repost' });
  if (rateLimited) return rateLimited;
  try {
    const { postId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json();
    const result = await service.repost(postId, user, body);
    return apiSuccess(result, result.post ? 201 : 200);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
