import { NextRequest } from 'next/server';
import { HertzMemberProfileService } from '@shared/services/hertzMemberProfileService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const profileService = new HertzMemberProfileService();

export async function GET() {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const profile = await profileService.getOwnProfile(user.id);
    return apiSuccess({ profile });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json();
    const profile = await profileService.updateOwnProfile(user.id, body);
    return apiSuccess({ profile });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
