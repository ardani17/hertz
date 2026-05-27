import { NextRequest } from 'next/server';
import { HertzInAppNotificationService } from '@shared/services/hertzInAppNotificationService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzInAppNotificationService();

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read' }, async ({ auth }) => {
    return apiSuccess(await service.summary(auth.user.id));
  });
}

