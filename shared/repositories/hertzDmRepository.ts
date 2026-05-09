import { execute, query, queryOne, type DbClient } from '../db';

export interface HertzInboxRow {
  id: string;
  direct_key: string | null;
  archived_at: Date | null;
  last_read_at: Date | null;
  last_message_at: Date | null;
  last_message_body: string | null;
  last_sender_id: string | null;
  peer_id: string | null;
  peer_username: string | null;
  peer_display_name: string | null;
  peer_avatar_url: string | null;
  peer_role: 'member' | 'admin' | null;
  unread_count: string;
}

export interface HertzMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  deleted_at: Date | null;
  created_at: Date;
  sender_username: string | null;
  sender_display_name: string | null;
  sender_avatar_url: string | null;
  sender_role: 'member' | 'admin';
}

export interface HertzMessageAttachmentRow {
  id: string;
  message_id: string;
  file_url: string;
  file_key: string | null;
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp';
  file_size: number;
  created_at: Date;
}

export class HertzDmRepository {
  async listInbox(userId: string, includeArchived = false, client?: DbClient): Promise<HertzInboxRow[]> {
    const result = await query<HertzInboxRow>(
      `SELECT c.id, c.direct_key, p.archived_at, p.last_read_at, c.last_message_at,
              lm.body AS last_message_body, lm.sender_id AS last_sender_id,
              peer.user_id AS peer_id, u.username AS peer_username,
              u.display_name AS peer_display_name, u.avatar_url AS peer_avatar_url,
              u.role AS peer_role,
              COALESCE(unread.count, 0)::text AS unread_count
       FROM hertz_conversations c
       JOIN hertz_conversation_participants p ON p.conversation_id = c.id AND p.user_id = $1
       LEFT JOIN hertz_messages lm ON lm.id = c.last_message_id
       LEFT JOIN hertz_conversation_participants peer ON peer.conversation_id = c.id AND peer.user_id <> $1
       LEFT JOIN users u ON u.id = peer.user_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS count
         FROM hertz_messages m
         WHERE m.conversation_id = c.id
           AND m.sender_id <> $1
           AND m.deleted_at IS NULL
           AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
       ) unread ON true
       WHERE ($2::boolean = true OR p.archived_at IS NULL)
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
      [userId, includeArchived],
      client,
    );
    return result.rows;
  }

  async createDirectConversation(userA: string, userB: string, client?: DbClient): Promise<{ id: string }> {
    const directKey = [userA, userB].sort().join(':');
    const conversation = await queryOne<{ id: string }>(
      `INSERT INTO hertz_conversations (direct_key)
       VALUES ($1)
       ON CONFLICT (direct_key) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [directKey],
      client,
    );
    if (!conversation) throw new Error('Failed to create conversation');
    await execute(
      `INSERT INTO hertz_conversation_participants (conversation_id, user_id)
       VALUES ($1, $2), ($1, $3)
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [conversation.id, userA, userB],
      client,
    );
    return conversation;
  }

  async listMessages(conversationId: string, userId: string, client?: DbClient): Promise<HertzMessageRow[]> {
    const result = await query<HertzMessageRow>(
      `SELECT m.*, u.username AS sender_username, u.display_name AS sender_display_name,
              u.avatar_url AS sender_avatar_url, u.role AS sender_role
       FROM hertz_messages m
       JOIN hertz_conversation_participants p ON p.conversation_id = m.conversation_id
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1 AND p.user_id = $2
       ORDER BY m.created_at ASC`,
      [conversationId, userId],
      client,
    );
    return result.rows;
  }

  async listAttachments(messageIds: string[], client?: DbClient): Promise<HertzMessageAttachmentRow[]> {
    if (messageIds.length === 0) return [];
    const result = await query<HertzMessageAttachmentRow>(
      `SELECT id, message_id, file_url, file_key, mime_type, file_size, created_at
       FROM hertz_message_attachments
       WHERE message_id = ANY($1::uuid[])
       ORDER BY created_at ASC`,
      [messageIds],
      client,
    );
    return result.rows;
  }

  async sendMessage(conversationId: string, senderId: string, body: string | null, client?: DbClient): Promise<{ id: string }> {
    const message = await queryOne<{ id: string }>(
      `INSERT INTO hertz_messages (conversation_id, sender_id, body)
       SELECT $1, $2, $3
       WHERE EXISTS (
         SELECT 1 FROM hertz_conversation_participants
         WHERE conversation_id = $1 AND user_id = $2
       )
       RETURNING id`,
      [conversationId, senderId, body],
      client,
    );
    if (!message) throw new Error('Gagal mengirim pesan');
    await execute(
      `UPDATE hertz_conversations
       SET last_message_id = $1, last_message_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [message.id, conversationId],
      client,
    );
    return message;
  }

  async attachImages(messageId: string, files: Array<{ fileUrl: string; fileKey?: string | null; mimeType: string; fileSize: number }>, client?: DbClient): Promise<void> {
    for (const file of files) {
      await execute(
        `INSERT INTO hertz_message_attachments (message_id, file_url, file_key, mime_type, file_size)
         VALUES ($1, $2, $3, $4, $5)`,
        [messageId, file.fileUrl, file.fileKey ?? null, file.mimeType, file.fileSize],
        client,
      );
    }
  }

  async markRead(conversationId: string, userId: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE hertz_conversation_participants SET last_read_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
      client,
    );
  }

  async archive(conversationId: string, userId: string, archived: boolean, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE hertz_conversation_participants
       SET archived_at = CASE WHEN $3 THEN NOW() ELSE NULL END
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId, archived],
      client,
    );
  }

  async softDeleteMessage(messageId: string, userId: string, client?: DbClient): Promise<void> {
    await execute('UPDATE hertz_messages SET deleted_at = NOW() WHERE id = $1 AND sender_id = $2', [messageId, userId], client);
  }

  async blockUser(blockerId: string, blockedId: string, client?: DbClient): Promise<void> {
    await execute(
      `INSERT INTO hertz_blocks (blocker_user_id, blocked_user_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_user_id, blocked_user_id) DO NOTHING`,
      [blockerId, blockedId],
      client,
    );
  }

  async unblockUser(blockerId: string, blockedId: string, client?: DbClient): Promise<void> {
    await execute('DELETE FROM hertz_blocks WHERE blocker_user_id = $1 AND blocked_user_id = $2', [blockerId, blockedId], client);
  }

  async reportMessage(messageId: string, userId: string, reason: string, details: string | null, client?: DbClient): Promise<void> {
    await execute(
      `INSERT INTO hertz_message_reports (message_id, reporter_user_id, reason, details)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (message_id, reporter_user_id)
       DO UPDATE SET reason = EXCLUDED.reason, details = EXCLUDED.details, status = 'open', created_at = NOW()`,
      [messageId, userId, reason, details],
      client,
    );
  }
}
