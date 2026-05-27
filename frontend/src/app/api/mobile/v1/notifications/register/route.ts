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
      const device = await devices.register(auth.user.id, await request.json());
      return apiSuccess({
        deviceToken: {
          id: device.id,
          platform: device.platform,
          deviceId: device.device_id,
          appVersion: device.app_version,
          enabled: device.enabled,
          lastSeenAt: device.last_seen_at instanceof Date ? device.last_seen_at.toISOString() : String(device.last_seen_at),
        },
      }, 201);
    } catch (error) {
      return apiErrorFromMobileUnknown(error) ?? apiErrorFromUnknown(error);
    }
  });
}
