import { execute, query, queryOne, type DbClient } from '../db';

export class HertzDmRepository {
  async listInbox(userId: string, client?: DbClient) {
    const result = await query(
      `SELECT c.*, p.last_read_at
       FROM hertz_conversations c
       JOIN hertz_conversation_participants p ON p.conversation_id = c.id
       WHERE p.user_id = $1 AND p.archived_at IS NULL
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
      [userId],
      client,
    );
    return result.rows;
  }

  async findDirectConversation(userA: string, userB: string, client?: DbClient) {
    const directKey = [userA, userB].sort().join(':');
    return queryOne<{ id: string }>(
      'SELECT id FROM hertz_conversations WHERE direct_key = $1',
      [directKey],
      client,
    );
  }

  async createDirectConversation(userA: string, userB: string, client?: DbClient) {
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

  async listMessages(conversationId: string, userId: string, client?: DbClient) {
    const result = await query(
      `SELECT m.*
       FROM hertz_messages m
       JOIN hertz_conversation_participants p ON p.conversation_id = m.conversation_id
       WHERE m.conversation_id = $1 AND p.user_id = $2
       ORDER BY m.created_at ASC`,
      [conversationId, userId],
      client,
    );
    return result.rows;
  }

  async sendMessage(conversationId: string, senderId: string, body: string | null, client?: DbClient) {
    const message = await queryOne<{ id: string }>(
      `INSERT INTO hertz_messages (conversation_id, sender_id, body)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [conversationId, senderId, body],
      client,
    );
    if (!message) throw new Error('Failed to send message');
    await execute(
      `UPDATE hertz_conversations
       SET last_message_id = $1, last_message_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [message.id, conversationId],
      client,
    );
    return message;
  }

  async markRead(conversationId: string, userId: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE hertz_conversation_participants
       SET last_read_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
      client,
    );
  }
}
