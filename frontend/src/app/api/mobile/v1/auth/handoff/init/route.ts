import { NextRequest } from 'next/server';
import { MobileAuthService } from '@/server/services/auth/MobileAuthService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const auth = new MobileAuthService();

export async function POST(request: NextRequest) {
  return withMobileRoute(request, { policy: 'device', requireAuth: false, appVersion: false }, async () => {
    const handoff = await auth.initHandoff(await request.json());
    return apiSuccess(handoff, 201);
  });
}

