import { NextRequest } from 'next/server';
import { HertzCommunityNoteService } from '@shared/services/hertzCommunityNoteService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ noteId: string }>;
}

const notes = new HertzCommunityNoteService();

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { noteId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json();
    await notes.edit(noteId, user, body.content);
    return apiSuccess({ updated: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { noteId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    await notes.delete(noteId, user);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
