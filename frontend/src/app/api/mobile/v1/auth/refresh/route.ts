import { NextRequest } from 'next/server';
import { MemberSessionService } from '@shared/services/memberSessionService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const sessions = new MemberSessionService();

export async function POST(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'auth', auth.user.id);
  if (limited) return limited;

  try {
    const refreshed = await sessions.refreshSession(auth.token);
    if (!refreshed) return apiError('AUTH_REQUIRED', 'Bearer token tidak valid atau sudah kedaluwarsa', 401);
    return apiSuccess({
      token: refreshed.token,
      expiresAt: refreshed.expiresAt.toISOString(),
      user: refreshed.user,
    });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
