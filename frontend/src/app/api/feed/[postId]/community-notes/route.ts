import { NextRequest } from 'next/server';
import { FeedService } from '@shared/services/feedService';
import { CommunityNoteService } from '@shared/services/communityNoteService';
import { checkRateLimit } from '@/lib/rateLimit';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ postId: string }>;
}

const feed = new FeedService();
const notes = new CommunityNoteService();

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const viewer = await getCurrentMember();
    const detail = await feed.getPostDetail(postId, viewer);
    return apiSuccess({ communityNotes: detail.communityNotes });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = checkRateLimit(request, { max: 10, windowMs: 24 * 60 * 60 * 1000, prefix: 'community-note' });
  if (rateLimited) return rateLimited;
  try {
    const { postId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json();
    const note = await notes.create(postId, user, body);
    return apiSuccess({ note }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
