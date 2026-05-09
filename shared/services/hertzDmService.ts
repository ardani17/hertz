import { withTransaction, query } from '../db';
import { HertzDmRepository } from '../repositories/hertzDmRepository';
import type { MemberSessionUser } from '../types/membership';

export class HertzDmService {
  private readonly repo = new HertzDmRepository();

  async inbox(user: MemberSessionUser) {
    return this.repo.listInbox(user.id);
  }

  async createDirect(user: MemberSessionUser, recipientId: string) {
    if (recipientId === user.id) throw new Error('Tidak bisa DM diri sendiri');
    return withTransaction((client) => this.repo.createDirectConversation(user.id, recipientId, client));
  }

  async thread(user: MemberSessionUser, conversationId: string) {
    const messages = await this.repo.listMessages(conversationId, user.id);
    await this.repo.markRead(conversationId, user.id);
    return { messages };
  }

  async send(user: MemberSessionUser, conversationId: string, body: unknown) {
    const text = typeof body === 'string' ? body.trim() : '';
    if (!text) throw new Error('Pesan tidak boleh kosong');
    return this.repo.sendMessage(conversationId, user.id, text.slice(0, 4000));
  }

  async searchMembers(queryText: string) {
    const result = await query(
      `SELECT id, username, display_name, avatar_url, role
       FROM users
       WHERE (username ILIKE $1 OR display_name ILIKE $1)
         AND verified_member_at IS NOT NULL
       ORDER BY display_name ASC NULLS LAST
       LIMIT 10`,
      [`%${queryText}%`],
    );
    return result.rows;
  }
}
