import { execute, query, queryOne, type DbClient } from '../db';

export type HertzNotificationType = 'pulse' | 'comment' | 'repost' | 'quote' | 'dm';
export type HertzNotificationTargetType = 'post' | 'comment' | 'conversation';

export interface HertzNotificationRow {
  id: string;
  user_id: string;
  actor_user_id: string | null;
  type: HertzNotificationType;
  target_type: HertzNotificationTargetType;
  target_id: string;
  post_id: string | null;
  conversation_id: string | null;
  metadata: Record<string, unknown>;
  read_at: Date | null;
  created_at: Date;
  actor_username: string | null;
  actor_display_name: string | null;
  actor_avatar_url: string | null;
  actor_role: 'member' | 'admin' | null;
  post_short_id: string | null;
  post_content: string | null;
}

export interface HertzNotificationPostRecipient {
  author_id: string;
  short_id: string;
  content: string | null;
}

export interface CreateHertzNotificationInput {
  userId: string;
  actorUserId?: string | null;
  type: HertzNotificationType;
  targetType: HertzNotificationTargetType;
  targetId: string;
  postId?: string | null;
  conversationId?: string | null;
  metadata?: Record<string, unknown>;
}

export class HertzNotificationRepository {
  async create(input: CreateHertzNotificationInput, client?: DbClient): Promise<void> {
    const conflict = getConflictClause(input.type);
    await execute(
      `INSERT INTO hertz_notifications (user_id, actor_user_id, type, target_type, target_id, post_id, conversation_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       ${conflict}`,
      [input.userId, input.actorUserId ?? null, input.type, input.targetType, input.targetId, input.postId ?? null, input.conversationId ?? null, JSON.stringify(input.metadata ?? {})],
      client,
    );
  }

  async listForUser(userId: string, limit = 30, client?: DbClient): Promise<HertzNotificationRow[]> {
    const result = await query<HertzNotificationRow>(
      `SELECT n.*, actor.username AS actor_username, actor.display_name AS actor_display_name,
              actor.avatar_url AS actor_avatar_url, actor.role AS actor_role,
              hp.short_id AS post_short_id, hp.content AS post_content
       FROM hertz_notifications n
       LEFT JOIN users actor ON actor.id = n.actor_user_id
       LEFT JOIN hertz_posts hp ON hp.id = n.post_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2`,
      [userId, Math.min(Math.max(limit, 1), 80)],
      client,
    );
    return result.rows;
  }

  async countUnread(userId: string, client?: DbClient): Promise<number> {
    const row = await queryOne<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM hertz_notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId],
      client,
    );
    return Number(row?.count ?? 0);
  }

  async markRead(userId: string, notificationId: string, client?: DbClient): Promise<void> {
    await execute('UPDATE hertz_notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = $1 AND user_id = $2', [notificationId, userId], client);
  }

  async markAllRead(userId: string, client?: DbClient): Promise<void> {
    await execute('UPDATE hertz_notifications SET read_at = COALESCE(read_at, NOW()) WHERE user_id = $1 AND read_at IS NULL', [userId], client);
  }

  async findPostRecipient(postId: string, client?: DbClient): Promise<HertzNotificationPostRecipient | null> {
    return queryOne<HertzNotificationPostRecipient>('SELECT author_id, short_id, content FROM hertz_posts WHERE id = $1 AND deleted_at IS NULL', [postId], client);
  }

  async findConversationRecipient(conversationId: string, actorUserId: string, client?: DbClient): Promise<string | null> {
    const row = await queryOne<{ user_id: string }>('SELECT user_id FROM hertz_conversation_participants WHERE conversation_id = $1 AND user_id <> $2 LIMIT 1', [conversationId, actorUserId], client);
    return row?.user_id ?? null;
  }
}

function getConflictClause(type: HertzNotificationType): string {
  if (type === 'pulse') {
    return `ON CONFLICT (user_id, actor_user_id, type, post_id)
            WHERE type = 'pulse' AND post_id IS NOT NULL
            DO UPDATE SET created_at = NOW(), read_at = NULL, metadata = EXCLUDED.metadata`;
  }
  if (type === 'dm') {
    return `ON CONFLICT (user_id, actor_user_id, type, conversation_id)
            WHERE type = 'dm' AND conversation_id IS NOT NULL
            DO UPDATE SET target_id = EXCLUDED.target_id, created_at = NOW(), read_at = NULL, metadata = EXCLUDED.metadata`;
  }
  return '';
}
