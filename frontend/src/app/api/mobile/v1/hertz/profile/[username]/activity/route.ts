import { NextRequest } from 'next/server';
import { queryOne } from '@shared/db';
import { HertzProfileService } from '@shared/services/hertzProfileService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ username: string }>;
}

export const dynamic = 'force-dynamic';

const service = new HertzProfileService();

export async function GET(request: NextRequest, context: RouteContext) {
  const limited = await checkMobileRateLimit(request, 'read');
  if (limited) return limited;

  try {
    const { username } = await context.params;
    const user = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND verified_member_at IS NOT NULL LIMIT 1',
      [username],
    );
    if (!user) return apiError('RESOURCE_NOT_FOUND', 'Profil tidak ditemukan', 404);
    return apiSuccess({ activity: await service.getActivity(user.id) });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

