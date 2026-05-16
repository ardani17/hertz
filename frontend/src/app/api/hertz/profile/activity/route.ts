import { getCurrentMember } from '@/lib/memberAuth';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { HertzProfileService } from '@shared/services/hertzProfileService';

export const dynamic = 'force-dynamic';

const service = new HertzProfileService();

export async function GET() {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    return apiSuccess({ activity: await service.getActivity(user.id) });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
