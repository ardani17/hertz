import { NextRequest } from 'next/server';
import { ChallengeTrackerService } from '@shared/services/challengeTrackerService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext { params: Promise<{ accountId: string }> }
export const dynamic = 'force-dynamic';
const service = new ChallengeTrackerService();

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { accountId } = await context.params;
    const body = await request.json().catch(() => null) as { archived?: unknown } | null;
    const account = await service.archiveAccount(user.id, accountId, Boolean(body?.archived));
    return apiSuccess({ account });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
