import { NextRequest } from 'next/server';
import { MembershipService } from '@shared/services/membershipService';
import { MemberSessionService } from '@shared/services/memberSessionService';
import type { TelegramAuthData } from '@shared/types/membership';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const membership = new MembershipService();
const sessions = new MemberSessionService();

export async function POST(request: NextRequest) {
  const limited = checkMobileRateLimit(request, 'auth');
  if (limited) return limited;

  try {
    const body = (await request.json()) as TelegramAuthData;
    const user = await membership.verifyLogin(body);
    const session = await sessions.createSession(user.id);
    return apiSuccess({
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      user,
      loginMechanism: 'telegram_external_browser_callback',
    }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
