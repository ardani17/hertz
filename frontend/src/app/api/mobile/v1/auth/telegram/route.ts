import { NextRequest } from 'next/server';
import { MobileAuthService } from '@shared/services/mobileAuthService';
import type { TelegramAuthData } from '@shared/types/membership';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const auth = new MobileAuthService();

export async function POST(request: NextRequest) {
  const limited = await checkMobileRateLimit(request, 'auth');
  if (limited) return limited;

  try {
    const body = await request.json();
    return apiSuccess(await auth.createTelegramSession(body as TelegramAuthData, {
      deviceId: typeof body.deviceId === 'string' ? body.deviceId : null,
      platform: body.platform === 'ios' || body.platform === 'android' ? body.platform : null,
      appVersion: typeof body.appVersion === 'string' ? body.appVersion : null,
    }), 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
