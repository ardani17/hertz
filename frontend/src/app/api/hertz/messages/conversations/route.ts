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
    const members = await service.searchMembers(request.nextUrl.searchParams.get('q') ?? '', user.id);
    return apiSuccess({ members });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json();
    const conversation = await service.createDirect(user, String(body.recipientId || ''));
    return apiSuccess({ conversation }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
