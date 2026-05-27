import { NextRequest } from 'next/server';
import { HertzReactionService } from '@shared/services/hertzInteractionService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const reactions = new HertzReactionService();

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const { shortId } = await context.params;
    const result = await reactions.togglePulse(shortId, auth.user);
    return apiSuccess({ liked: result.active, active: result.active });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
