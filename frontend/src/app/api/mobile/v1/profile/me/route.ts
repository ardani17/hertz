import { NextRequest } from 'next/server';
import { HertzMemberProfileService } from '@shared/services/hertzMemberProfileService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const profiles = new HertzMemberProfileService();

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read' }, async ({ auth }) => {
    return apiSuccess({ profile: await profiles.getOwnProfile(auth.user.id) });
  });
}

export async function PATCH(request: NextRequest) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    return apiSuccess({ profile: await profiles.updateOwnProfile(auth.user.id, await request.json()) });
  });
}

