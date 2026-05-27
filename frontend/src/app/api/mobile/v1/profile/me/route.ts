import { NextRequest } from 'next/server';
import { HertzMemberProfileService } from '@shared/services/hertzMemberProfileService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const profiles = new HertzMemberProfileService();

export async function GET(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'read', auth.user.id);
  if (limited) return limited;

  try {
    return apiSuccess({ profile: await profiles.getOwnProfile(auth.user.id) });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    return apiSuccess({ profile: await profiles.updateOwnProfile(auth.user.id, await request.json()) });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

