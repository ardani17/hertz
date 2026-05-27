import { NextRequest } from 'next/server';
import { DeviceTokenService } from '@shared/services/deviceTokenService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import {
  apiErrorFromMobileUnknown,
  checkMobileRateLimit,
  isMobileAuthContext,
  requireMobileMember,
} from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const devices = new DeviceTokenService();

export async function POST(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'device', auth.user.id);
  if (limited) return limited;

  try {
    await devices.unregister(auth.user.id, await request.json());
    return apiSuccess({ unregistered: true });
  } catch (error) {
    return apiErrorFromMobileUnknown(error) ?? apiErrorFromUnknown(error);
  }
}
