import { NextRequest } from 'next/server';
import { HertzBookmarkService } from '@shared/services/hertzInteractionService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const service = new HertzBookmarkService();

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const { shortId } = await context.params;
    const result = await service.toggleBookmark(shortId, auth.user);
    return apiSuccess({ ...result, bookmarked: result.active });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

