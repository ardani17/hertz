import { NextRequest } from 'next/server';
import { MobileAuthService } from '@shared/services/mobileAuthService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export const dynamic = 'force-dynamic';

const mobileAuth = new MobileAuthService();

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const { sessionId } = await context.params;
    await mobileAuth.revokeSession(auth.user.id, sessionId, auth.token);
    return apiSuccess({ revoked: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

