import { NextRequest } from 'next/server';
import { HertzViewService } from '@shared/services/hertzInteractionService';
import { apiSuccess } from '@/lib/apiResponse';
import { getBearerTokenFromRequest } from '@/lib/memberAuth';
import { withMobileRoute } from '@/lib/mobileApi';

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
  return withMobileRoute(request, { policy: 'mutation', requireAuth: false }, async ({ viewer }) => {
    const { shortId } = await context.params;
    const result = await service.recordView({
      postId: shortId,
      userId: viewer?.id ?? null,
      sessionToken: getBearerTokenFromRequest(request),
      ip: getIp(request),
      userAgent: request.headers.get('user-agent'),
    });
    return apiSuccess(result);
  });
}

