import { NextRequest } from 'next/server';
import { HertzPublicProfileService } from '@shared/services/hertzPublicProfileService';
import { MobileReadCache } from '@shared/infra/MobileReadCache';
import { apiError, apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ username: string }>;
}

export const dynamic = 'force-dynamic';

const profiles = new HertzPublicProfileService();
const readCache = new MobileReadCache();

export async function GET(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'read', requireAuth: false }, async ({ viewer }) => {
    const { username } = await context.params;
    const cacheKey = `profile:${username.toLowerCase()}:${viewer?.id ?? 'guest'}`;
    const cached = await readCache.get<{ profile: NonNullable<Awaited<ReturnType<HertzPublicProfileService['getPublicProfileByUsername']>>>; stats: unknown; isBlockedByMe: boolean; isBlockingMe: boolean }>(cacheKey);
    if (cached) return apiSuccess(cached);

    const profile = await profiles.getPublicProfileByUsername(username, viewer);
    if (!profile) return apiError('RESOURCE_NOT_FOUND', 'Profil tidak ditemukan', 404);
    const payload = { profile, stats: profile.publicCounters, isBlockedByMe: false, isBlockingMe: false };
    await readCache.set(cacheKey, payload);
    return apiSuccess(payload);
  });
}

