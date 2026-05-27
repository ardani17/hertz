import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function GET(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'read', auth.user.id);
  if (limited) return limited;

  try {
    const conversations = await service.inbox(auth.user, request.nextUrl.searchParams.get('archived') === '1');
    return apiSuccess({ items: conversations.map((item) => ({
      conversationId: item.id,
      lastMessage: {
        body: item.lastMessageBody,
        sentAt: item.lastMessageAt ? new Date(item.lastMessageAt).toISOString() : null,
        fromMe: false,
      },
      unreadCount: item.unreadCount,
      participant: item.peer ? {
        userId: item.peer.id,
        username: item.peer.username,
        displayName: item.peer.displayName,
        avatarUrl: item.peer.avatarUrl,
        role: item.peer.role,
      } : null,
      archivedAt: item.archivedAt ? new Date(item.archivedAt).toISOString() : null,
      lastReadAt: item.lastReadAt ? new Date(item.lastReadAt).toISOString() : null,
    })), nextCursor: null });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

