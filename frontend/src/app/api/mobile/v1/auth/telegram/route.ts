import { NextRequest } from 'next/server';
import { MobileAuthService } from '@shared/services/mobileAuthService';
import type { TelegramAuthData } from '@shared/types/membership';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const auth = new MobileAuthService();

export async function POST(request: NextRequest) {
  const limited = checkMobileRateLimit(request, 'auth');
  if (limited) return limited;

  try {
    const body = (await request.json()) as TelegramAuthData;
    return apiSuccess(await auth.createTelegramSession(body), 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
