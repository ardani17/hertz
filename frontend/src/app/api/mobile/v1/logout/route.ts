import { NextRequest } from 'next/server';
import { MemberSessionService } from '@shared/services/memberSessionService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const sessions = new MemberSessionService();

export async function POST(request: NextRequest) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    await sessions.deleteSession(auth.token);
    return apiSuccess({ loggedOut: true });
  });
}
