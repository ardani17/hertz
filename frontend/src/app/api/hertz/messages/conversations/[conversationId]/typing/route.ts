import { NextRequest } from 'next/server';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';
import { clearTypingStatus, listTypingStatuses, setTypingStatus } from '@/lib/redis';
import { RedisUnavailableError } from '@/lib/typing/redis-unavailable';
import { filterActiveTypingStatuses } from '@/lib/typing/typing-utils';
import { HertzDmRepository } from '@shared/repositories/hertzDmRepository';

export const dynamic = 'force-dynamic';

const dmRepo = new HertzDmRepository();

async function assertParticipant(conversationId: string, userId: string) {
  const messages = await dmRepo.listMessages(conversationId, userId);
  if (messages.length === 0 && !(await dmRepo.listInbox(userId)).some((row) => row.id === conversationId)) {
    throw new Error('FORBIDDEN');
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<{ conversationId: string }> }) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { conversationId } = await context.params;
    try {
      await assertParticipant(conversationId, user.id);
    } catch {
      return apiError('FORBIDDEN', 'Akses percakapan ditolak', 403);
    }
    const statuses = await listTypingStatuses(conversationId, user.id);
    const typingUsers = filterActiveTypingStatuses(statuses, { now: Date.now(), selfUserId: user.id });
    return apiSuccess({ typingUsers });
  } catch (error) {
    if (error instanceof RedisUnavailableError) return apiSuccess({ typingUsers: [] });
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ conversationId: string }> }) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { conversationId } = await context.params;
    try {
      await assertParticipant(conversationId, user.id);
    } catch {
      return apiError('FORBIDDEN', 'Akses percakapan ditolak', 403);
    }
    const body = await request.json().catch(() => ({}));
    if (body.clear === true) {
      await clearTypingStatus(conversationId, user.id);
      return apiSuccess({ cleared: true });
    }
    await setTypingStatus({
      conversationId,
      userId: user.id,
      displayName: user.displayName ?? user.username ?? 'Member',
    });
    return apiSuccess({ ok: true });
  } catch (error) {
    if (error instanceof RedisUnavailableError) {
      return apiError('SERVICE_UNAVAILABLE', 'Layanan indikator mengetik tidak tersedia', 503);
    }
    return apiErrorFromUnknown(error);
  }
}
