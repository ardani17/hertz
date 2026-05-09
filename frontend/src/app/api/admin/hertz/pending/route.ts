import { HertzAdminService } from '@shared/services/hertzAdminService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';
import { validateSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const adminService = new HertzAdminService();

async function getAdminMember() {
  const member = await getCurrentMember();
  if (member?.role === 'admin') return member;
  const admin = await validateSession();
  if (!admin) return null;
  return {
    id: admin.id,
    telegramId: admin.telegram_id,
    username: admin.username,
    displayName: admin.username ?? 'Admin',
    avatarUrl: null,
    role: 'admin' as const,
    badge: 'admin' as const,
    verifiedMemberAt: null,
  };
}

export async function GET() {
  try {
    const admin = await getAdminMember();
    const pending = await adminService.listPending(admin);
    return apiSuccess(pending);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
