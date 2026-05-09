import { NextRequest } from 'next/server';
import { HertzCommunityNoteService } from '@shared/services/hertzCommunityNoteService';
import { checkRateLimit } from '@/lib/rateLimit';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ noteId: string }>;
}

const notes = new HertzCommunityNoteService();

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = checkRateLimit(request, { max: 60, windowMs: 10 * 60 * 1000, prefix: 'community-note-rating' });
  if (rateLimited) return rateLimited;
  try {
    const { noteId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json();
    await notes.rate(noteId, user, body.rating);
    return apiSuccess({ rated: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
