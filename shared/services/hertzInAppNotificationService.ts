import { HertzDmRepository } from '../repositories/hertzDmRepository';
import { HertzNotificationRepository, type HertzNotificationRow, type HertzNotificationType } from '../repositories/hertzNotificationRepository';
import { encodeCursor, clampLimit } from '../utils/cursor';


export interface HertzInAppNotificationActor {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: 'member' | 'admin' | null;
}

export interface HertzInAppNotificationItem {
  id: string;
  type: HertzNotificationType;
  targetType: string;
  targetId: string;
  href: string;
  readAt: Date | null;
  createdAt: Date;
  metadata: Record<string, unknown>;
  actor: HertzInAppNotificationActor | null;
  post: { id: string; shortId: string | null; preview: string | null } | null;
}

export interface HertzInAppNotificationSummary {
  unreadCount: number;
  hasUnread: boolean;
  unreadDmCount: number;
  hasUnreadDm: boolean;
}

export function buildHertzInAppNotificationSummary({ unreadCount, unreadDmCount }: { unreadCount: number; unreadDmCount: number }): HertzInAppNotificationSummary {
  const unread = normalizeCount(unreadCount);
  const dm = normalizeCount(unreadDmCount);
  return { unreadCount: unread, hasUnread: unread > 0, unreadDmCount: dm, hasUnreadDm: dm > 0 };
}

export function shouldNotifyRecipient(recipientId: string | null | undefined, actorUserId: string): boolean {
  return Boolean(recipientId && recipientId !== actorUserId);
}

export function getHertzNotificationHref(input: { type: HertzNotificationType; metadata?: Record<string, unknown> | null; postShortId?: string | null }): string {
  if (input.type === 'dm') return '/hertz/messages';
  const shortId = typeof input.metadata?.postShortId === 'string' ? input.metadata.postShortId : input.postShortId;
  return shortId ? `/hertz/post/${shortId}` : '/hertz';
}

function normalizeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export class HertzInAppNotificationService {
  private readonly notifications = new HertzNotificationRepository();
  private readonly dm = new HertzDmRepository();

  async list(
    userId: string,
    options: { limit?: number; cursor?: string | null } = {},
  ): Promise<{ notifications: HertzInAppNotificationItem[]; nextCursor: string | null; summary: HertzInAppNotificationSummary }> {
    const limit = clampLimit(options.limit, 30, 80);
    const rows = await this.notifications.listForUser(userId, { limit: limit + 1, cursor: options.cursor ?? null });
    const pageRows = rows.slice(0, limit);
    const nextRow = rows.length > limit ? rows[limit] : null;
    return {
      notifications: pageRows.map(mapNotificationRow),
      nextCursor: nextRow ? encodeCursor({ createdAt: nextRow.created_at, id: nextRow.id }) : null,
      summary: await this.summary(userId),
    };
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.notifications.markRead(userId, id);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifications.markAllRead(userId);
  }

  async notifyPulse(params: { postId: string; actorUserId: string }): Promise<void> {
    await this.notifyPostEvent('pulse', params.postId, params.actorUserId, params.postId);
  }

  async notifyComment(params: { postId: string; commentId: string; actorUserId: string }): Promise<void> {
    await this.notifyPostEvent('comment', params.postId, params.actorUserId, params.commentId);
  }

  async notifyRepost(params: { postId: string; actorUserId: string; repostPostId?: string | null }): Promise<void> {
    await this.notifyPostEvent('repost', params.postId, params.actorUserId, params.repostPostId ?? params.postId);
  }

  async notifyQuote(params: { postId: string; actorUserId: string; quotePostId: string }): Promise<void> {
    await this.notifyPostEvent('quote', params.postId, params.actorUserId, params.quotePostId);
  }

  async notifyDm(params: { conversationId: string; messageId: string; actorUserId: string }): Promise<void> {
    const recipientId = await this.notifications.findConversationRecipient(params.conversationId, params.actorUserId);
    if (!shouldNotifyRecipient(recipientId, params.actorUserId)) return;
    await this.notifications.create({
      userId: recipientId!,
      actorUserId: params.actorUserId,
      type: 'dm',
      targetType: 'conversation',
      targetId: params.messageId,
      conversationId: params.conversationId,
      metadata: { conversationId: params.conversationId, messageId: params.messageId },
    });
  }

  private async notifyPostEvent(type: 'pulse' | 'comment' | 'repost' | 'quote', postId: string, actorUserId: string, targetId: string): Promise<void> {
    const post = await this.notifications.findPostRecipient(postId);
    if (!shouldNotifyRecipient(post?.author_id, actorUserId)) return;
    await this.notifications.create({
      userId: post!.author_id,
      actorUserId,
      type,
      targetType: type === 'comment' ? 'comment' : 'post',
      targetId,
      postId,
      metadata: { postShortId: post!.short_id, postPreview: getPreview(post!.content) },
    });
  }

  async summary(userId: string): Promise<HertzInAppNotificationSummary> {
    const [unreadCount, unreadDmCount] = await Promise.all([
      this.notifications.countUnread(userId),
      this.dm.countUnread(userId),
    ]);
    return buildHertzInAppNotificationSummary({ unreadCount, unreadDmCount });
  }
}


function normalizeMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function mapNotificationRow(row: HertzNotificationRow): HertzInAppNotificationItem {
  const metadata = normalizeMetadata(row.metadata);
  const postShortId = typeof metadata.postShortId === 'string' ? metadata.postShortId : row.post_short_id;
  return {
    id: row.id,
    type: row.type,
    targetType: row.target_type,
    targetId: row.target_id,
    href: getHertzNotificationHref({ type: row.type, metadata, postShortId }),
    readAt: row.read_at,
    createdAt: row.created_at,
    metadata,
    actor: row.actor_user_id ? {
      id: row.actor_user_id,
      username: row.actor_username,
      displayName: row.actor_display_name ?? row.actor_username ?? 'Member Hertz',
      avatarUrl: row.actor_avatar_url,
      role: row.actor_role,
    } : null,
    post: row.post_id ? {
      id: row.post_id,
      shortId: postShortId,
      preview: typeof metadata.postPreview === 'string' ? metadata.postPreview : row.post_content,
    } : null,
  };
}

function getPreview(value: string | null | undefined): string | null {
  const text = value?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > 120 ? `${text.slice(0, 120).trimEnd()}…` : text;
}
