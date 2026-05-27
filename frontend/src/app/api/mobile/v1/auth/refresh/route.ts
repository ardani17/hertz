import { NextRequest } from 'next/server';
import { MemberSessionService } from '@shared/services/memberSessionService';
import { apiError, apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const sessions = new MemberSessionService();

export async function POST(request: NextRequest) {
  return withMobileRoute(request, { policy: 'auth' }, async ({ auth }) => {
    const body = await request.json().catch(() => ({}));
    const refreshed = await sessions.refreshSession(auth.token);
    if (!refreshed) return apiError('AUTH_REQUIRED', 'Bearer token tidak valid atau sudah kedaluwarsa', 401);
    sessions.assertDeviceMatch(refreshed.session, typeof body.deviceId === 'string' ? body.deviceId : null);
    return apiSuccess({
      token: refreshed.token,
      expiresAt: refreshed.expiresAt.toISOString(),
      user: refreshed.user,
      session: {
        id: refreshed.session.sessionId,
        deviceId: refreshed.session.deviceId,
        platform: refreshed.session.platform,
        appVersion: refreshed.session.appVersion,
        expiresAt: refreshed.session.expiresAt.toISOString(),
        createdAt: refreshed.session.createdAt.toISOString(),
        lastUsedAt: refreshed.session.lastUsedAt ? refreshed.session.lastUsedAt.toISOString() : null,
        current: true,
      },
    });
  });
}
