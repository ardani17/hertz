import { SignalLedgerAdminService } from '@shared/services/signalLedgerAdminService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';
import { validateSession } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ commentId: string }>;
}

const service = new SignalLedgerAdminService();

async function getAdminMember() {
  const member = await getCurrentMember();
  if (member?.role === 'admin') return member;
  const admin = await validateSession();
  if (!admin) return null;
  return { id: admin.id, telegramId: admin.telegram_id, username: admin.username, displayName: admin.username ?? 'Admin', avatarUrl: null, role: 'admin' as const, badge: 'admin' as const, verifiedMemberAt: null };
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { commentId } = await context.params;
    await service.hideComment(commentId, await getAdminMember());
    return apiSuccess({ hidden: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
