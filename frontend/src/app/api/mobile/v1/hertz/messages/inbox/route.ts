import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read' }, async ({ auth }) => {
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
  });
}

