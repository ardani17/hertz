import { NextRequest } from 'next/server';
import { HertzRepostService } from '@shared/services/hertzInteractionService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const service = new HertzRepostService();

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const { shortId } = await context.params;
    const body = await request.json();
    const result = await service.repost(shortId, auth.user, body);
    return apiSuccess(result, 'post' in result ? 201 : 200);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

