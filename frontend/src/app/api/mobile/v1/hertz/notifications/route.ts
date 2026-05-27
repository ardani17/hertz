import { NextRequest } from 'next/server';
import { HertzInAppNotificationService } from '@shared/services/hertzInAppNotificationService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzInAppNotificationService();

export async function GET(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'read', auth.user.id);
  if (limited) return limited;

  try {
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 30);
    const result = await service.list(auth.user.id, limit);
    return apiSuccess({
      items: result.notifications.map((item) => ({
        ...item,
        readAt: item.readAt ? item.readAt.toISOString() : null,
        createdAt: item.createdAt.toISOString(),
        actor: item.actor ? {
          userId: item.actor.id,
          username: item.actor.username,
          displayName: item.actor.displayName,
          avatarUrl: item.actor.avatarUrl,
        } : null,
      })),
      nextCursor: null,
      summary: result.summary,
    });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

