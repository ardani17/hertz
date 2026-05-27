import { NextRequest } from 'next/server';
import { HertzInAppNotificationService } from '@shared/services/hertzInAppNotificationService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const service = new HertzInAppNotificationService();

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 30);
    const result = await service.list(user.id, { limit });
    return apiSuccess({ notifications: result.notifications, summary: result.summary });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
