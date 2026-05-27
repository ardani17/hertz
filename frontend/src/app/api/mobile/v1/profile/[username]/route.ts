import { NextRequest } from 'next/server';
import { HertzPublicProfileService } from '@shared/services/hertzPublicProfileService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, optionalMobileMember } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ username: string }>;
}

export const dynamic = 'force-dynamic';

const profiles = new HertzPublicProfileService();

export async function GET(request: NextRequest, context: RouteContext) {
  const limited = checkMobileRateLimit(request, 'read');
  if (limited) return limited;

  try {
    const { username } = await context.params;
    const viewer = await optionalMobileMember(request);
    const profile = await profiles.getPublicProfileByUsername(username, viewer);
    if (!profile) return apiError('RESOURCE_NOT_FOUND', 'Profil tidak ditemukan', 404);
    return apiSuccess({ profile, stats: profile.publicCounters, isBlockedByMe: false, isBlockingMe: false });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

