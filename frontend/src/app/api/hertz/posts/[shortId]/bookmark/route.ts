import { NextRequest } from 'next/server';
import { HertzBookmarkService } from '@shared/services/hertzInteractionService';
import { checkRateLimit } from '@/lib/rateLimit';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const service = new HertzBookmarkService();

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = checkRateLimit(request, { max: 120, windowMs: 10 * 60 * 1000, prefix: 'bookmark-toggle' });
  if (rateLimited) return rateLimited;
  try {
    const { shortId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const result = await service.toggleBookmark(shortId, user);
    return apiSuccess(result);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
