import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    return apiSuccess({ conversations: await service.inbox(user, request.nextUrl.searchParams.get('archived') === '1') });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
