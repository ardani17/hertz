import { NextRequest } from 'next/server';
import { MobileAuthService } from '@/server/services/auth/MobileAuthService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export const dynamic = 'force-dynamic';

const mobileAuth = new MobileAuthService();

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { sessionId } = await context.params;
    await mobileAuth.revokeSession(auth.user.id, sessionId, auth.token);
    return apiSuccess({ revoked: true });
  });
}

