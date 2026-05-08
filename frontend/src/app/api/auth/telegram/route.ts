import { NextRequest } from 'next/server';
import { MembershipService } from '@shared/services/membershipService';
import { MemberSessionService } from '@shared/services/memberSessionService';
import type { TelegramAuthData } from '@shared/types/membership';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { setMemberSessionCookie } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const membership = new MembershipService();
const sessions = new MemberSessionService();

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TelegramAuthData;
    const user = await membership.verifyLogin(body);
    const session = await sessions.createSession(user.id);
    await setMemberSessionCookie(session.token, session.expiresAt);
    return apiSuccess({ user }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
