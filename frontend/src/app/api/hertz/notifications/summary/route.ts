import { HertzInAppNotificationService } from '@shared/services/hertzInAppNotificationService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const service = new HertzInAppNotificationService();

export async function GET() {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    return apiSuccess(await service.summary(user.id));
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
