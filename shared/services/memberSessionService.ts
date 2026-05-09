import { createHmac, randomUUID } from 'crypto';
import { MemberSessionRepository } from '../repositories/memberSessionRepository';
import { MembershipRepository } from '../repositories/membershipRepository';
import { MembershipService, toMemberSessionUser } from './membershipService';
import type { MemberSessionUser } from '../types/membership';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function hashMemberSessionToken(token: string): string {
  const secret = process.env.MEMBER_SESSION_SECRET
    || process.env.TELEGRAM_BOT_TOKEN
    || 'horizon-member-session-dev';
  return createHmac('sha256', secret).update(token).digest('hex');
}

export class MemberSessionService {
  private readonly sessions = new MemberSessionRepository();
  private readonly memberships = new MembershipRepository();
  private readonly verifier = new MembershipService();

  async createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await this.sessions.create({
      userId,
      tokenHash: hashMemberSessionToken(token),
      expiresAt,
    });
    return { token, expiresAt };
  }

  async validateToken(token: string | null): Promise<MemberSessionUser | null> {
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

    await this.sessions.touch(session.id);
    return toMemberSessionUser(user);
  }

  async deleteSession(token: string | null): Promise<void> {
    if (!token) return;
    await this.sessions.deleteByTokenHash(hashMemberSessionToken(token));
  }
}
