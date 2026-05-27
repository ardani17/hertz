import { NextRequest } from 'next/server';
import { HertzInAppNotificationService } from '@shared/services/hertzInAppNotificationService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzInAppNotificationService();

export async function POST(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => null);
    if (Array.isArray(body?.ids) && body.ids.length > 0) {
      await Promise.all(body.ids.filter((id: unknown): id is string => typeof id === 'string').map((id: string) => service.markRead(auth.user.id, id)));
      return apiSuccess({ marked: body.ids.length });
    }
    if (typeof body?.id === 'string') {
      await service.markRead(auth.user.id, body.id);
      return apiSuccess({ marked: 1 });
    }
    await service.markAllRead(auth.user.id);
    return apiSuccess({ marked: 'all' });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

