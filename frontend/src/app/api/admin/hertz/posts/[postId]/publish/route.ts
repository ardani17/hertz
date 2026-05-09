import { HertzAdminService } from '@shared/services/hertzAdminService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';
import { validateSession } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ postId: string }>;
}

const service = new HertzAdminService();

async function getAdminMember() {
  const member = await getCurrentMember();
  if (member?.role === 'admin') return member;
  const admin = await validateSession();
  if (!admin) return null;
  return { id: admin.id, telegramId: admin.telegram_id, username: admin.username, displayName: admin.username ?? 'Admin', avatarUrl: null, role: 'admin' as const, badge: 'admin' as const, verifiedMemberAt: null };
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { postId } = await context.params;
    await service.publish(postId, await getAdminMember());
    return apiSuccess({ published: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
