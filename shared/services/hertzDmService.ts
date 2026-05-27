import { query, queryOne, withTransaction } from '../db';
import { HertzDmRepository } from '../repositories/hertzDmRepository';
import { HertzForbiddenError, HertzValidationError } from './hertzPostService';
import { PushNotificationService } from './pushNotificationService';
import { HertzInAppNotificationService } from './hertzInAppNotificationService';
import type { MemberSessionUser } from '../types/membership';
import { clampLimit, encodeCursor } from '../utils/cursor';

export class HertzDmService {
  private readonly repo = new HertzDmRepository();
  private readonly push = new PushNotificationService();
  private readonly inAppNotifications = new HertzInAppNotificationService();

  async inbox(
    user: MemberSessionUser,
    includeArchived = false,
    options: { cursor?: string | null; limit?: number } = {},
  ) {
    const limit = clampLimit(options.limit, 20, 50);
    const rows = await this.repo.listInbox(user.id, includeArchived, { cursor: options.cursor ?? null, limit: limit + 1 });
    const pageRows = rows.slice(0, limit);
    const nextRow = rows.length > limit ? rows[limit] : null;
    const items = pageRows.map((row) => ({
      id: row.id,
      archivedAt: row.archived_at,
      lastReadAt: row.last_read_at,
      lastMessageAt: row.last_message_at,
      lastMessageBody: row.last_message_body,
      lastSenderId: row.last_sender_id,
      unreadCount: Number(row.unread_count ?? 0),
      peer: row.peer_id ? {
        id: row.peer_id,
        username: row.peer_username,
        displayName: row.peer_display_name ?? row.peer_username ?? 'Member Hertz',
        avatarUrl: row.peer_avatar_url,
        role: row.peer_role,
      } : null,
    }));
    return {
      items,
      nextCursor: nextRow
        ? encodeCursor({ createdAt: nextRow.last_message_at ?? nextRow.created_at, id: nextRow.id })
        : null,
    };
  }

  async createDirect(user: MemberSessionUser, recipientId: string) {
    const result = await this.createDirectResolved(user, { recipientId });
    return result.conversation;
  }

  async createDirectResolved(
    user: MemberSessionUser,
    input: { recipientId?: string; recipientUsername?: string },
  ): Promise<{ conversation: { id: string }; existing: boolean }> {
    let recipientId = input.recipientId?.trim() ?? '';
    if (!recipientId && input.recipientUsername) {
      const row = await queryOne<{ id: string }>(
        `SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND verified_member_at IS NOT NULL LIMIT 1`,
        [input.recipientUsername.trim()],
      );
      recipientId = row?.id ?? '';
    }
    if (!recipientId) throw new HertzValidationError('Penerima wajib dipilih');
    if (recipientId === user.id) throw new HertzValidationError('Tidak bisa DM diri sendiri');
    const directKey = [user.id, recipientId].sort().join(':');
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM hertz_conversations WHERE direct_key = $1 LIMIT 1`,
      [directKey],
    );
    if (existing) return { conversation: { id: existing.id }, existing: true };
    const conversation = await withTransaction((client) => this.repo.createDirectConversation(user.id, recipientId, client));
    return { conversation, existing: false };
  }

  async threadAfter(user: MemberSessionUser, conversationId: string, afterMessageId: string) {
    const messages = await this.repo.listMessagesAfter(conversationId, user.id, afterMessageId);
    await this.repo.markRead(conversationId, user.id);
    const mapped = await this.mapThreadMessages(user, messages);
    return { isPartial: true, messages: mapped };
  }

  async thread(user: MemberSessionUser, conversationId: string) {
    const messages = await this.repo.listMessages(conversationId, user.id);
    await this.repo.markRead(conversationId, user.id);
    const mapped = await this.mapThreadMessages(user, messages);
    return { isPartial: false, messages: mapped };
  }

  private async mapThreadMessages(user: MemberSessionUser, messages: Awaited<ReturnType<HertzDmRepository['listMessages']>>) {
    const attachments = await this.repo.listAttachments(messages.map((message) => message.id));
    return messages.map((message) => ({
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      body: message.deleted_at ? null : message.body,
      deletedAt: message.deleted_at,
      createdAt: message.created_at,
      sender: {
        id: message.sender_id,
        username: message.sender_username,
        displayName: message.sender_display_name ?? message.sender_username ?? 'Member Hertz',
        avatarUrl: message.sender_avatar_url,
        role: message.sender_role,
      },
      attachments: attachments
        .filter((attachment) => attachment.message_id === message.id)
        .map((attachment) => ({
          id: attachment.id,
          url: attachment.file_url,
          mimeType: attachment.mime_type,
          size: Number(attachment.file_size),
        })),
      canDelete: message.sender_id === user.id,
    }));
  }

  async send(user: MemberSessionUser, conversationId: string, body: unknown, attachments: unknown = []) {
    const text = typeof body === 'string' ? body.trim() : '';
    const files = validateDmAttachments(attachments);
    if (!text && files.length === 0) throw new HertzValidationError('Pesan tidak boleh kosong');
    const message = await withTransaction(async (client) => {
      const message = await this.repo.sendMessage(conversationId, user.id, text ? text.slice(0, 4000) : null, client);
      await this.repo.attachImages(message.id, files, client);
      return message;
    });
    void this.push.notifyDmMessageCreated({ conversationId, messageId: message.id, senderId: user.id });
    void this.inAppNotifications.notifyDm({ conversationId, messageId: message.id, actorUserId: user.id }).catch(() => undefined);
    return message;
  }

  async searchMembers(queryText: string, currentUserId?: string) {
    const text = queryText.trim();
    if (text.length < 2) return [];
    const result = await query(
      `SELECT id, username, display_name, avatar_url, role
       FROM users
       WHERE (username ILIKE $1 OR display_name ILIKE $1)
         AND verified_member_at IS NOT NULL
         AND ($2::uuid IS NULL OR id <> $2::uuid)
       ORDER BY display_name ASC NULLS LAST
       LIMIT 10`,
      [`%${text}%`, currentUserId ?? null],
    );
    return result.rows;
  }

  async archive(user: MemberSessionUser, conversationId: string, archived: boolean): Promise<void> {
    await this.repo.archive(conversationId, user.id, archived);
  }

  async deleteMessage(user: MemberSessionUser, messageId: string): Promise<void> {
    await this.repo.softDeleteMessage(messageId, user.id);
  }

  async block(user: MemberSessionUser, blockedUserId: string, blocked: boolean): Promise<void> {
    if (!blockedUserId || blockedUserId === user.id) throw new HertzForbiddenError();
    if (blocked) await this.repo.blockUser(user.id, blockedUserId);
    else await this.repo.unblockUser(user.id, blockedUserId);
  }

  async report(user: MemberSessionUser, messageId: string, reason: unknown, details: unknown): Promise<void> {
    const reasonText = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 50) : 'other';
    const detailsText = typeof details === 'string' && details.trim() ? details.trim().slice(0, 2000) : null;
    await this.repo.reportMessage(messageId, user.id, reasonText, detailsText);
  }
}

export function validateDmAttachments(value: unknown) {
  if (!Array.isArray(value)) return [];
  if (value.length > 4) throw new HertzValidationError('Maksimal 4 gambar per pesan');
  return value.map((item) => {
    const record = item as Record<string, unknown>;
    const fileUrl = typeof record.fileUrl === 'string' ? record.fileUrl.trim() : '';
    const mimeType = typeof record.mimeType === 'string' ? record.mimeType : '';
    const fileSize = Number(record.fileSize ?? 0);
    if (!fileUrl || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      throw new HertzValidationError('Attachment DM tidak valid');
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > 5 * 1024 * 1024) {
      throw new HertzValidationError('Ukuran gambar maksimal 5MB');
    }
    return {
      fileUrl,
      fileKey: typeof record.fileKey === 'string' ? record.fileKey : null,
      mimeType,
      fileSize,
    };
  });
}
