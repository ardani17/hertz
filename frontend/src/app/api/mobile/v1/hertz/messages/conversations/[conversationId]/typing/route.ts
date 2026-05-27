import { NextRequest } from 'next/server';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';
import { clearTypingStatus, listTypingStatuses, setTypingStatus } from '@/lib/redis';
import { RedisUnavailableError } from '@/lib/typing/redis-unavailable';
import { filterActiveTypingStatuses } from '@/lib/typing/typing-utils';
import { HertzDmRepository } from '@shared/repositories/hertzDmRepository';

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export const dynamic = 'force-dynamic';

const dmRepo = new HertzDmRepository();

async function assertParticipant(conversationId: string, userId: string) {
  const messages = await dmRepo.listMessages(conversationId, userId);
  if (messages.length === 0 && !(await dmRepo.listInbox(userId)).some((row) => row.id === conversationId)) {
    throw new Error('FORBIDDEN');
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'read', auth.user.id);
  if (limited) return limited;

  try {
    const { conversationId } = await context.params;
    await assertParticipant(conversationId, auth.user.id);
    const statuses = await listTypingStatuses(conversationId, auth.user.id);
    const typingUsers = filterActiveTypingStatuses(statuses, { now: Date.now(), selfUserId: auth.user.id });
    return apiSuccess({ typingUsers });
  } catch (error) {
    if (error instanceof RedisUnavailableError) return apiSuccess({ typingUsers: [] });
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('FORBIDDEN', 'Akses percakapan ditolak', 403);
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const { conversationId } = await context.params;
    await assertParticipant(conversationId, auth.user.id);
    const body = await request.json().catch(() => ({}));
    if (body.clear === true) {
      await clearTypingStatus(conversationId, auth.user.id);
      return apiSuccess({ cleared: true });
    }
    await setTypingStatus({
      conversationId,
      userId: auth.user.id,
      displayName: auth.user.displayName ?? auth.user.username ?? 'Member',
    });
    return apiSuccess({ ok: true });
  } catch (error) {
    if (error instanceof RedisUnavailableError) return apiError('SERVICE_UNAVAILABLE', 'Layanan indikator mengetik tidak tersedia', 503);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('FORBIDDEN', 'Akses percakapan ditolak', 403);
    return apiErrorFromUnknown(error);
  }
}

