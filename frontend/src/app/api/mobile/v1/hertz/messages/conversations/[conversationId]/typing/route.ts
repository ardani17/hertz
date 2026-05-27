import { NextRequest } from 'next/server';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';
import { clearTypingStatus, listTypingStatuses, setTypingStatus } from '@/lib/redis';
import { RedisUnavailableError } from '@/lib/typing/redis-unavailable';
import { filterActiveTypingStatuses } from '@/lib/typing/typing-utils';
import { HertzDmRepository } from '@shared/repositories/hertzDmRepository';

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export const dynamic = 'force-dynamic';

const dmRepo = new HertzDmRepository();

function buildTypingResponse(statuses: ReturnType<typeof filterActiveTypingStatuses>) {
  const typingUserIds = statuses.map((status) => status.userId);
  const lastUpdatedMs = statuses.reduce((latest, status) => Math.max(latest, status.lastTypingAt), 0);
  return {
    typingUserIds,
    lastUpdated: lastUpdatedMs > 0 ? new Date(lastUpdatedMs).toISOString() : null,
  };
}

async function assertParticipant(conversationId: string, userId: string) {
  const messages = await dmRepo.listMessages(conversationId, userId);
  if (messages.length === 0 && !(await dmRepo.listInbox(userId)).some((row) => row.id === conversationId)) {
    throw new Error('FORBIDDEN');
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'read' }, async ({ auth }) => {
    try {
      const { conversationId } = await context.params;
      await assertParticipant(conversationId, auth.user.id);
      const now = Date.now();
      const statuses = await listTypingStatuses(conversationId, auth.user.id);
      const active = filterActiveTypingStatuses(statuses, { now, selfUserId: auth.user.id });
      return apiSuccess(buildTypingResponse(active));
    } catch (error) {
      if (error instanceof RedisUnavailableError) return apiSuccess({ typingUserIds: [], lastUpdated: null });
      if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('FORBIDDEN', 'Akses percakapan ditolak', 403);
      return apiErrorFromUnknown(error);
    }
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    try {
      const { conversationId } = await context.params;
      await assertParticipant(conversationId, auth.user.id);
      const body = await request.json().catch(() => ({}));
      if (body.clear === true || body.typing === false) {
        await clearTypingStatus(conversationId, auth.user.id);
        return apiSuccess({ cleared: true });
      }
      if (body.typing === true || body.typing === undefined) {
        await setTypingStatus({
          conversationId,
          userId: auth.user.id,
          displayName: auth.user.displayName ?? auth.user.username ?? 'Member',
        });
        return apiSuccess({ ok: true });
      }
      return apiError('VALIDATION_ERROR', 'Body typing harus boolean', 400);
    } catch (error) {
      if (error instanceof RedisUnavailableError) return apiError('SERVICE_UNAVAILABLE', 'Layanan indikator mengetik tidak tersedia', 503);
      if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('FORBIDDEN', 'Akses percakapan ditolak', 403);
      return apiErrorFromUnknown(error);
    }
  });
}

