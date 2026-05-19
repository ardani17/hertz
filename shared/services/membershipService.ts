import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { withTransaction } from '../db';
import { MembershipRepository } from '../repositories/membershipRepository';
import type { MemberSessionUser, MembershipCheckResult, TelegramAuthData } from '../types/membership';

export class MembershipCheckUnavailableError extends Error {
  constructor(message = 'Membership check unavailable') {
    super(message);
    this.name = 'MembershipCheckUnavailableError';
  }
}

export class NotGroupMemberError extends Error {
  constructor(message = 'Akun Telegram Anda belum terdaftar sebagai member grup Horizon.') {
    super(message);
    this.name = 'NotGroupMemberError';
  }
}

export class TelegramAuthInvalidError extends Error {
  constructor(message = 'Verifikasi Telegram gagal') {
    super(message);
    this.name = 'TelegramAuthInvalidError';
  }
}

export class DevTelegramLoginDisabledError extends Error {
  constructor(message = 'Login dev Telegram tidak diaktifkan') {
    super(message);
    this.name = 'DevTelegramLoginDisabledError';
  }
}

/** Hanya untuk dev lokal — tidak aktif saat NODE_ENV=production. */
export function isDevTelegramLoginEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.ALLOW_DEV_TELEGRAM_LOGIN === 'true';
}

const MEMBERSHIP_CACHE_MS = 24 * 60 * 60 * 1000;

export function verifyTelegramAuthData(authData: TelegramAuthData, botToken = process.env.TELEGRAM_BOT_TOKEN): boolean {
  if (!botToken || !authData.hash) return false;
  const { hash, ...data } = authData;
  const checkString = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(checkString).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function isTelegramAuthFresh(authDate: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - authDate < 86400;
}

export function toMemberSessionUser(user: {
  id: string;
  telegram_id: number | null;
  username: string | null;
  role: 'member' | 'admin';
  display_name?: string | null;
  avatar_url?: string | null;
  telegram_first_name?: string | null;
  telegram_last_name?: string | null;
  verified_member_at?: Date | null;
}): MemberSessionUser {
  const displayName = user.display_name
    || [user.telegram_first_name, user.telegram_last_name].filter(Boolean).join(' ')
    || user.username
    || 'Member Horizon';
  return {
    id: user.id,
    telegramId: user.telegram_id,
    username: user.username,
    displayName,
    avatarUrl: user.avatar_url ?? null,
    role: user.role,
    badge: user.role === 'admin' ? 'admin' : 'verified_member',
    verifiedMemberAt: user.verified_member_at
      ? user.verified_member_at.toISOString()
      : null,
  };
}

export class MembershipService {
  private readonly repo = new MembershipRepository();

  async verifyLogin(authData: TelegramAuthData): Promise<MemberSessionUser> {
    if (!verifyTelegramAuthData(authData) || !isTelegramAuthFresh(authData.auth_date)) {
      throw new TelegramAuthInvalidError();
    }

    const groupId = Number(process.env.HORIZON_TELEGRAM_GROUP_ID || '-1001916607651');
    const isMember = await this.checkGroupMembership(authData.id, groupId);
    if (!isMember) {
      throw new NotGroupMemberError();
    }

    return this.completeVerifiedLogin(authData.id, authData, groupId);
  }

  /**
   * Local development login: upsert user by Telegram ID without widget HMAC.
   * Requires ALLOW_DEV_TELEGRAM_LOGIN=true. Never enable in production.
   */
  async verifyDevLogin(telegramId: number): Promise<MemberSessionUser> {
    if (!isDevTelegramLoginEnabled()) {
      throw new DevTelegramLoginDisabledError();
    }
    if (!Number.isFinite(telegramId) || telegramId <= 0) {
      throw new TelegramAuthInvalidError('Telegram ID tidak valid');
    }

    const groupId = Number(process.env.HORIZON_TELEGRAM_GROUP_ID || '-1001916607651');
    const skipMembership = process.env.DEV_SKIP_MEMBERSHIP_CHECK === 'true';
    let isMember = skipMembership;
    if (!skipMembership) {
      isMember = await this.checkGroupMembership(telegramId, groupId);
    }
    if (!isMember) {
      throw new NotGroupMemberError();
    }

    const authData: TelegramAuthData = {
      id: telegramId,
      first_name: 'Dev',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'dev-bypass',
    };
    return this.completeVerifiedLogin(telegramId, authData, groupId);
  }

  private async completeVerifiedLogin(
    telegramId: number,
    authData: TelegramAuthData,
    groupId: number,
  ): Promise<MemberSessionUser> {
    return withTransaction(async (client) => {
      const user = await this.repo.upsertTelegramUser(authData, client);
      await this.repo.upsertMembership(
        {
          userId: user.id,
          telegramId,
          groupId,
          isMember: true,
          rawResponse: { isMember: true },
        },
        client,
      );
      return toMemberSessionUser(user);
    });
  }

  async ensureMembershipFresh(user: { id: string; telegram_id: number | null }, failClosed = true): Promise<boolean> {
    if (!user.telegram_id) return false;
    const groupId = Number(process.env.HORIZON_TELEGRAM_GROUP_ID || '-1001916607651');
    const cached = await this.repo.findRecentMembership(user.telegram_id, groupId, MEMBERSHIP_CACHE_MS);
    if (cached) return cached.is_member;

    try {
      const isMember = await this.checkGroupMembership(user.telegram_id, groupId);
      await this.repo.upsertMembership({
        userId: user.id,
        telegramId: user.telegram_id,
        groupId,
        isMember,
        rawResponse: { isMember },
      });
      return isMember;
    } catch (error) {
      if (failClosed) throw error;
      return false;
    }
  }

  private async checkGroupMembership(telegramId: number, groupId: number): Promise<boolean> {
    const url = process.env.MEMBERSHIP_CHECK_URL;
    const token = process.env.MEMBERSHIP_CHECK_TOKEN;
    if (!url || !token) {
      throw new MembershipCheckUnavailableError();
    }

    const endpoint = new URL(url);
    endpoint.searchParams.set('groupId', String(groupId));
    endpoint.searchParams.set('userId', String(telegramId));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
    } catch {
      throw new MembershipCheckUnavailableError();
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new MembershipCheckUnavailableError();
    }

    const data = (await response.json()) as MembershipCheckResult;
    return data.isMember === true;
  }
}
