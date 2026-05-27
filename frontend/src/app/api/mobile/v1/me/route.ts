import { NextRequest } from 'next/server';
import { MobileAuthService } from '@/server/services/auth/MobileAuthService';
import { withMobileRoute } from '@/lib/mobileApi';
import { apiSuccess } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

const mobileAuth = new MobileAuthService();

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read' }, async ({ auth }) =>
    apiSuccess(await mobileAuth.buildMe(auth.token, auth.user.id)));
}
