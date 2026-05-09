import { HertzDmService } from '@shared/services/hertzDmService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function GET() {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    return apiSuccess({ conversations: await service.inbox(user) });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
