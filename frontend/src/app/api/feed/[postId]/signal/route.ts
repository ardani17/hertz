import { NextRequest } from 'next/server';
import { PostReactionService } from '@shared/services/postReactionService';
import { checkRateLimit } from '@/lib/rateLimit';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ postId: string }>;
}

const service = new PostReactionService();

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = checkRateLimit(request, { max: 120, windowMs: 10 * 60 * 1000, prefix: 'signal-toggle' });
  if (rateLimited) return rateLimited;
  try {
    const { postId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const result = await service.toggleSignal(postId, user);
    return apiSuccess(result);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
