import { NextRequest } from 'next/server';
import { HertzPublicProfileService } from '@shared/services/hertzPublicProfileService';
import { apiError, apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ username: string }>;
}

export const dynamic = 'force-dynamic';

const profiles = new HertzPublicProfileService();

export async function GET(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'read', requireAuth: false }, async ({ viewer }) => {
    const { username } = await context.params;
    const profile = await profiles.getPublicProfileByUsername(username, viewer);
    if (!profile) return apiError('RESOURCE_NOT_FOUND', 'Profil tidak ditemukan', 404);
    return apiSuccess({ profile, stats: profile.publicCounters, isBlockedByMe: false, isBlockingMe: false });
  });
}

