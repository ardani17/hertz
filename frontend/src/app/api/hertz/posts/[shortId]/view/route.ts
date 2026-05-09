import { NextRequest } from 'next/server';
import { HertzViewService } from '@shared/services/hertzInteractionService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember, getMemberSessionToken } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const service = new HertzViewService();

function getIp(request: NextRequest): string | null {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { shortId } = await context.params;
    const user = await getCurrentMember();
    const token = await getMemberSessionToken();
    const result = await service.recordView({
      postId: shortId,
      userId: user?.id ?? null,
      sessionToken: token,
      ip: getIp(request),
      userAgent: request.headers.get('user-agent'),
    });
    return apiSuccess(result);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
