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
    // #region agent log
    fetch('http://127.0.0.1:7626/ingest/0e68ac60-4b93-4daf-93a7-baf0152c1922', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '621627' },
      body: JSON.stringify({
        sessionId: '621627',
        location: 'api/auth/telegram/route.ts:POST',
        message: 'telegram_login_start',
        data: { telegramId: body?.id, hasHash: Boolean(body?.hash) },
        hypothesisId: 'H4',
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const user = await membership.verifyLogin(body);
    const session = await sessions.createSession(user.id);
    await setMemberSessionCookie(session.token, session.expiresAt);
    // #region agent log
    fetch('http://127.0.0.1:7626/ingest/0e68ac60-4b93-4daf-93a7-baf0152c1922', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '621627' },
      body: JSON.stringify({
        sessionId: '621627',
        location: 'api/auth/telegram/route.ts:POST',
        message: 'telegram_login_ok',
        data: { userId: user.id },
        hypothesisId: 'H4',
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return apiSuccess({ user }, 201);
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7626/ingest/0e68ac60-4b93-4daf-93a7-baf0152c1922', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '621627' },
      body: JSON.stringify({
        sessionId: '621627',
        location: 'api/auth/telegram/route.ts:POST',
        message: 'telegram_login_fail',
        data: { errorName: error instanceof Error ? error.name : 'unknown' },
        hypothesisId: 'H2-H3-H4',
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return apiErrorFromUnknown(error);
  }
}
