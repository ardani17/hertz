import { NextRequest } from 'next/server';
import { ChallengeTrackerService } from '@shared/services/challengeTrackerService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext { params: Promise<{ accountId: string }> }
export const dynamic = 'force-dynamic';
const service = new ChallengeTrackerService();

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { accountId } = await context.params;
    const account = await service.getAccount(user.id, accountId);
    if (!account) return apiError('RESOURCE_NOT_FOUND', 'Challenge tidak ditemukan', 404);
    const trades = await service.listTrades(user.id, accountId);
    return apiSuccess({ trades });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { accountId } = await context.params;
    const trade = await service.createTrade(user.id, accountId, await request.json());
    return apiSuccess({ trade }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
