import { NextRequest } from 'next/server';
import { MemberSessionService } from '@shared/services/memberSessionService';
import { apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const sessions = new MemberSessionService();

export async function POST(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  await sessions.deleteSession(auth.token);
  return apiSuccess({ loggedOut: true });
}
