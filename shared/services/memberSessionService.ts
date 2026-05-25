import { createHmac, randomUUID } from 'crypto';
import { SESSION_IDLE_MS } from '../constants';
import { MemberSessionRepository } from '../repositories/memberSessionRepository';
import { MembershipRepository } from '../repositories/membershipRepository';
import { MembershipService, toMemberSessionUser } from './membershipService';
import type { MemberSessionUser } from '../types/membership';

export type ValidatedMemberSession = {
  user: MemberSessionUser;
  expiresAt: Date;
};

export function hashMemberSessionToken(token: string): string {
  const secret = process.env.MEMBER_SESSION_SECRET
    || process.env.TELEGRAM_BOT_TOKEN
    || 'hertz-member-session-dev';
  return createHmac('sha256', secret).update(token).digest('hex');
}

export class MemberSessionService {
  private readonly sessions = new MemberSessionRepository();
  private readonly memberships = new MembershipRepository();
  private readonly verifier = new MembershipService();

  async createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_IDLE_MS);
    await this.sessions.create({
      userId,
      tokenHash: hashMemberSessionToken(token),
      expiresAt,
    });
    return { token, expiresAt };
  }

  async validateToken(token: string | null): Promise<ValidatedMemberSession | null> {
    if (!token) return null;
    const tokenHash = hashMemberSessionToken(token);
    const session = await this.sessions.findByTokenHash(tokenHash);
    if (!session) return null;

    const expiresAt = session.expires_at instanceof Date
      ? session.expires_at
      : new Date(session.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      await this.sessions.deleteByTokenHash(tokenHash);
      return null;
    }

    const user = await this.memberships.findUserById(session.user_id);
    if (!user || user.banned_at) return null;
    if (user.role !== 'admin') {
      const stillMember = await this.verifier.ensureMembershipFresh(user, false);
      if (!stillMember) return null;
    }

    const nextExpiresAt = new Date(Date.now() + SESSION_IDLE_MS);
    await this.sessions.touchAndExtend(session.id, nextExpiresAt);
    return { user: toMemberSessionUser(user), expiresAt: nextExpiresAt };
  }

  async deleteSession(token: string | null): Promise<void> {
    if (!token) return;
    await this.sessions.deleteByTokenHash(hashMemberSessionToken(token));
  }

  async refreshSession(token: string | null): Promise<{ token: string; expiresAt: Date; user: MemberSessionUser } | null> {
    const validated = await this.validateToken(token);
    if (!validated || !token) return null;
    return { token, expiresAt: validated.expiresAt, user: validated.user };
  }
}
