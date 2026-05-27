import { NextRequest } from 'next/server';
import { DeviceTokenService } from '@shared/services/deviceTokenService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import {
  apiErrorFromMobileUnknown,
  withMobileRoute,
} from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const devices = new DeviceTokenService();

export async function POST(request: NextRequest) {
  return withMobileRoute(request, { policy: 'device' }, async ({ auth }) => {
    try {
      await devices.unregister(auth.user.id, await request.json());
      return apiSuccess({ unregistered: true });
    } catch (error) {
      return apiErrorFromMobileUnknown(error) ?? apiErrorFromUnknown(error);
    }
  });
}
