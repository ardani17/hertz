import { NextRequest } from 'next/server';
import { HertzCreditRepository } from '@shared/repositories/hertzCreditRepository';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const repo = new HertzCreditRepository();

async function requireAdmin() {
  const user = await getCurrentMember();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET() {
  try {
    if (!(await requireAdmin())) return apiError('AUTH_FORBIDDEN', 'Akses admin diperlukan', 403);
    return apiSuccess({ settings: await repo.listSettings() });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await requireAdmin())) return apiError('AUTH_FORBIDDEN', 'Akses admin diperlukan', 403);
    const body = await request.json();
    await repo.setAmount(String(body.key), Number(body.amount || 0), body.isActive !== false);
    return apiSuccess({ ok: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
