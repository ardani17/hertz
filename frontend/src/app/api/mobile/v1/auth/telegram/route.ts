import { NextRequest } from 'next/server';
import { MobileAuthService } from '@/server/services/auth/MobileAuthService';
import type { TelegramAuthData } from '@shared/types/membership';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const auth = new MobileAuthService();

export async function POST(request: NextRequest) {
  return withMobileRoute(request, { policy: 'auth', requireAuth: false }, async () => {
    const body = await request.json();
    return apiSuccess(await auth.createTelegramSession(body as TelegramAuthData, {
      deviceId: typeof body.deviceId === 'string' ? body.deviceId : null,
      platform: body.platform === 'ios' || body.platform === 'android' ? body.platform : null,
      appVersion: typeof body.appVersion === 'string' ? body.appVersion : null,
    }), 201);
  });
}
