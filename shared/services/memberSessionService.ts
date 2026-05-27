import { createHmac, randomUUID } from 'crypto';
import { SESSION_IDLE_MS } from '../constants';
import { MemberSessionRepository } from '../repositories/memberSessionRepository';
import { MembershipRepository } from '../repositories/membershipRepository';
import { MembershipService, toMemberSessionUser } from './membershipService';
import type { MemberSessionUser } from '../types/membership';

export type ValidatedMemberSession = {
  user: MemberSessionUser;
  expiresAt: Date;
  sessionId: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  deviceId: string | null;
  platform: string | null;
  appVersion: string | null;
};

export interface MemberSessionDeviceMeta {
  deviceId?: string | null;
  platform?: string | null;
  appVersion?: string | null;
}

export class SessionDeviceMismatchError extends Error {
  constructor(message = 'Sesi tidak sesuai dengan perangkat ini') {
    super(message);
    this.name = 'SessionDeviceMismatchError';
  }
}

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

  async createSession(userId: string, meta: MemberSessionDeviceMeta = {}): Promise<{ token: string; expiresAt: Date; sessionId: string }> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_IDLE_MS);
    const session = await this.sessions.create({
      userId,
      tokenHash: hashMemberSessionToken(token),
      expiresAt,
      deviceId: meta.deviceId,
      platform: meta.platform,
      appVersion: meta.appVersion,
    });
    return { token, expiresAt, sessionId: session?.id ?? '' };
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
    return {
      user: toMemberSessionUser(user),
      expiresAt: nextExpiresAt,
      sessionId: session.id,
      createdAt: session.created_at,
      lastUsedAt: session.last_used_at,
      deviceId: session.device_id,
      platform: session.platform,
      appVersion: session.app_version,
    };
  }

  async deleteSession(token: string | null): Promise<void> {
    if (!token) return;
    await this.sessions.deleteByTokenHash(hashMemberSessionToken(token));
  }

  async refreshSession(token: string | null): Promise<{
    token: string;
    expiresAt: Date;
    user: MemberSessionUser;
    session: ValidatedMemberSession;
  } | null> {
    const validated = await this.validateToken(token);
    if (!validated || !token) return null;
    const rotatedToken = randomUUID();
    await this.sessions.rotateTokenHash(validated.sessionId, hashMemberSessionToken(rotatedToken), validated.expiresAt);
    return { token: rotatedToken, expiresAt: validated.expiresAt, user: validated.user, session: validated };
  }

  assertDeviceMatch(session: ValidatedMemberSession, deviceId: string | null | undefined): void {
    const requestedDeviceId = typeof deviceId === 'string' ? deviceId.trim() : '';
    if (!session.deviceId || !requestedDeviceId) return;
    if (session.deviceId !== requestedDeviceId) {
      throw new SessionDeviceMismatchError();
    }
  }

  async listActiveSessions(userId: string): Promise<Array<{
    id: string;
    expiresAt: Date;
    createdAt: Date;
    lastUsedAt: Date | null;
    deviceId: string | null;
    platform: string | null;
    appVersion: string | null;
  }>> {
    const rows = await this.sessions.listActiveByUserId(userId);
    return rows.map((row) => ({
      id: row.id,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      deviceId: row.device_id,
      platform: row.platform,
      appVersion: row.app_version,
    }));
  }

  async deleteSessionByIdForUser(sessionId: string, userId: string): Promise<void> {
    await this.sessions.deleteByIdForUser(sessionId, userId);
  }
}
