import { NextRequest } from 'next/server';
import { HertzCommentService } from '@shared/services/hertzCommentService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ commentId: string }>;
}

const comments = new HertzCommentService();

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const { commentId } = await context.params;
    await comments.delete(commentId, auth.user);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
