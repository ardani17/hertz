import { NextRequest } from 'next/server';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';
import { apiSuccess } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'read', auth.user.id);
  if (limited) return limited;

  return apiSuccess({ user: auth.user });
}
