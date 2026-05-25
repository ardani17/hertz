import { apiSuccess } from '@/lib/apiResponse';
import { getCurrentMemberAndRefreshCookie } from '@/lib/memberAuth';
import { HertzNotificationService } from '@shared/services/hertzNotificationService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentMemberAndRefreshCookie();
  const notifications = user ? await new HertzNotificationService().summary(user.id) : null;
  return apiSuccess({ user, notifications });
}
