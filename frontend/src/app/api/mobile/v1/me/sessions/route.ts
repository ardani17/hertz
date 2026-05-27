import { NextRequest } from 'next/server';
import { MobileAuthService } from '@/server/services/auth/MobileAuthService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const mobileAuth = new MobileAuthService();

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read' }, async ({ auth }) => {
    return apiSuccess(await mobileAuth.listSessions(auth.user.id, auth.token));
  });
}

