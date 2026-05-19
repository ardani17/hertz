import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  DevTelegramLoginDisabledError,
  MembershipService,
  isDevTelegramLoginEnabled,
} from '@shared/services/membershipService';
import { MemberSessionService } from '@shared/services/memberSessionService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { setMemberSessionCookie } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  telegramId: z.coerce.number().int().positive(),
});

const membership = new MembershipService();
const sessions = new MemberSessionService();

export async function GET() {
  return apiSuccess({ enabled: isDevTelegramLoginEnabled() });
}

export async function POST(request: NextRequest) {
  if (!isDevTelegramLoginEnabled()) {
    return apiError('FORBIDDEN', 'Login dev Telegram tidak diaktifkan', 403);
  }

  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Telegram ID tidak valid', 400);
    }

    const user = await membership.verifyDevLogin(parsed.data.telegramId);
    const session = await sessions.createSession(user.id);
    await setMemberSessionCookie(session.token, session.expiresAt);
    return apiSuccess({ user }, 201);
  } catch (error) {
    if (error instanceof DevTelegramLoginDisabledError) {
      return apiError('FORBIDDEN', error.message, 403);
    }
    return apiErrorFromUnknown(error);
  }
}
