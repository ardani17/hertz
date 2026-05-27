import { NextRequest } from 'next/server';
import { HertzInAppNotificationService } from '@shared/services/hertzInAppNotificationService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzInAppNotificationService();

export async function GET(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'read', auth.user.id);
  if (limited) return limited;

  try {
    return apiSuccess(await service.summary(auth.user.id));
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

