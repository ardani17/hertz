import { NextRequest } from 'next/server';
import { ChallengeTrackerService } from '@shared/services/challengeTrackerService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';
const service = new ChallengeTrackerService();

export async function GET() {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    return apiSuccess({ accounts: await service.listAccounts(user.id) });
  } catch (error) { return apiErrorFromUnknown(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    return apiSuccess({ account: await service.createAccount(user.id, await request.json()) }, 201);
  } catch (error) { return apiErrorFromUnknown(error); }
}
