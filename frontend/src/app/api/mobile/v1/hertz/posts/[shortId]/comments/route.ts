import { NextRequest } from 'next/server';
import { HertzCommentService } from '@shared/services/hertzCommentService';
import { HertzPostService } from '@shared/services/hertzPostService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, optionalMobileMember, requireMobileMember } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const comments = new HertzCommentService();
const posts = new HertzPostService();

export async function GET(request: NextRequest, context: RouteContext) {
  const limited = await checkMobileRateLimit(request, 'read');
  if (limited) return limited;

  try {
    const { shortId } = await context.params;
    const viewer = await optionalMobileMember(request);
    const post = await posts.getPostDetail(shortId, viewer);
    return apiSuccess({ comments: post.comments });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const { shortId } = await context.params;
    const body = await request.json();
    const comment = await comments.create(shortId, auth.user, body.content, body.parentCommentId);
    return apiSuccess({ comment }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
