import { NextRequest } from 'next/server';
import { HertzPostService } from '@shared/services/hertzPostService';
import { HertzCommentService } from '@shared/services/hertzCommentService';
import { checkRateLimit } from '@/lib/rateLimit';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const feed = new HertzPostService();
const comments = new HertzCommentService();

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { shortId } = await context.params;
    const viewer = await getCurrentMember();
    const detail = await feed.getPostDetail(shortId, viewer);
    return apiSuccess({ comments: detail.comments });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = checkRateLimit(request, { max: 30, windowMs: 10 * 60 * 1000, prefix: 'post-comments' });
  if (rateLimited) return rateLimited;
  try {
    const { shortId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json();
    const comment = await comments.create(shortId, user, body.content);
    return apiSuccess({ comment }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
