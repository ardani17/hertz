import { NextRequest } from 'next/server';
import { MobileAuthService } from '@/server/services/auth/MobileAuthService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const mobileAuth = new MobileAuthService();

export async function GET(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'read', auth.user.id);
  if (limited) return limited;

  try {
    return apiSuccess(await mobileAuth.listSessions(auth.user.id, auth.token));
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

