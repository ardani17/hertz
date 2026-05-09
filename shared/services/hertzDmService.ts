import { query, withTransaction } from '../db';
import { HertzDmRepository } from '../repositories/hertzDmRepository';
import { HertzForbiddenError, HertzValidationError } from './hertzPostService';
import type { MemberSessionUser } from '../types/membership';

export class HertzDmService {
  private readonly repo = new HertzDmRepository();

  async inbox(user: MemberSessionUser, includeArchived = false) {
    const rows = await this.repo.listInbox(user.id, includeArchived);
    return rows.map((row) => ({
      id: row.id,
      archivedAt: row.archived_at,
      lastReadAt: row.last_read_at,
      lastMessageAt: row.last_message_at,
      lastMessageBody: row.last_message_body,
      unreadCount: Number(row.unread_count ?? 0),
      peer: row.peer_id ? {
        id: row.peer_id,
        username: row.peer_username,
        displayName: row.peer_display_name ?? row.peer_username ?? 'Member Horizon',
        avatarUrl: row.peer_avatar_url,
        role: row.peer_role,
      } : null,
    }));
  }

  async createDirect(user: MemberSessionUser, recipientId: string) {
    if (!recipientId) throw new HertzValidationError('Penerima wajib dipilih');
    if (recipientId === user.id) throw new HertzValidationError('Tidak bisa DM diri sendiri');
    return withTransaction((client) => this.repo.createDirectConversation(user.id, recipientId, client));
  }

  async thread(user: MemberSessionUser, conversationId: string) {
    const messages = await this.repo.listMessages(conversationId, user.id);
    const attachments = await this.repo.listAttachments(messages.map((message) => message.id));
    await this.repo.markRead(conversationId, user.id);
    return {
      messages: messages.map((message) => ({
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        body: message.deleted_at ? null : message.body,
        deletedAt: message.deleted_at,
        createdAt: message.created_at,
        sender: {
          id: message.sender_id,
          username: message.sender_username,
          displayName: message.sender_display_name ?? message.sender_username ?? 'Member Horizon',
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
      })),
    };
  }

  async send(user: MemberSessionUser, conversationId: string, body: unknown, attachments: unknown = []) {
    const text = typeof body === 'string' ? body.trim() : '';
    const files = validateAttachments(attachments);
    if (!text && files.length === 0) throw new HertzValidationError('Pesan tidak boleh kosong');
    return withTransaction(async (client) => {
      const message = await this.repo.sendMessage(conversationId, user.id, text ? text.slice(0, 4000) : null, client);
      await this.repo.attachImages(message.id, files, client);
      return message;
    });
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

function validateAttachments(value: unknown) {
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
