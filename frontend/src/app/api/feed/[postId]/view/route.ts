import { NextRequest } from 'next/server';
import { PostViewService } from '@shared/services/postViewService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember, getMemberSessionToken } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ postId: string }>;
}

const service = new PostViewService();

function getIp(request: NextRequest): string | null {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const user = await getCurrentMember();
    const token = await getMemberSessionToken();
    const result = await service.recordView({
      postId,
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
