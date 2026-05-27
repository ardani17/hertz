import { NextRequest } from 'next/server';
import { HertzInAppNotificationService } from '@shared/services/hertzInAppNotificationService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzInAppNotificationService();

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read' }, async ({ auth }) => {
    const { searchParams } = request.nextUrl;
    const result = await service.list(auth.user.id, {
      limit: Number(searchParams.get('limit') ?? 30),
      cursor: searchParams.get('cursor'),
    });
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
      nextCursor: result.nextCursor,
      summary: result.summary,
    });
  });
}
