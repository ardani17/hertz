import { randomBytes } from 'crypto';
import { AuthHandoffNonceRepository, type AuthHandoffPlatform } from '../repositories/authHandoffNonceRepository';
import { MemberSessionRepository } from '../repositories/memberSessionRepository';
import { MemberSessionService, hashMemberSessionToken } from './memberSessionService';
import { MembershipService } from './membershipService';
import { HertzInAppNotificationService } from './hertzInAppNotificationService';
import type {
  MobileAuthResponse,
  MobileHandoffInitResponse,
  MobileMeResponse,
  MobilePlatform,
  MobileSessionInfo,
  MobileSessionListResponse,
} from '../types/mobile';
import type { TelegramAuthData } from '../types/membership';

export class MobileAuthValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MobileAuthValidationError';
  }
}

export class MobileAuthNonceInvalidError extends Error {
  constructor(message = 'Nonce login tidak valid atau kedaluwarsa') {
    super(message);
    this.name = 'MobileAuthNonceInvalidError';
  }
}

export class MobileAuthCurrentSessionRevokeError extends Error {
  constructor(message = 'Gunakan logout untuk menghapus sesi aktif saat ini') {
    super(message);
    this.name = 'MobileAuthCurrentSessionRevokeError';
  }
}

function cleanText(value: unknown, max: number): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new MobileAuthValidationError('Device ID wajib diisi');
  return text.slice(0, max);
}

function cleanOptionalText(value: unknown, max: number): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text.slice(0, max) : null;
}

function normalizePlatform(value: unknown): AuthHandoffPlatform {
  if (value === 'ios' || value === 'android') return value;
  throw new MobileAuthValidationError('Platform harus ios atau android');
}

function nonceTtlMs() {
  const seconds = Number(process.env.MOBILE_HANDOFF_NONCE_TTL_SECONDS ?? 300);
  return Math.max(60, Math.min(Number.isFinite(seconds) ? seconds : 300, 900)) * 1000;
}

function publicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || `https://${process.env.DOMAIN || 'hertz.cloudnexify.com'}`).replace(/\/+$/, '');
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function createNonce() {
  return randomBytes(24).toString('base64url');
}

export class MobileAuthService {
  private readonly nonces = new AuthHandoffNonceRepository();
  private readonly sessions = new MemberSessionService();
  private readonly sessionRepo = new MemberSessionRepository();
  private readonly membership = new MembershipService();
  private readonly notifications = new HertzInAppNotificationService();

  async initHandoff(input: Record<string, unknown>): Promise<MobileHandoffInitResponse> {
    const deviceId = cleanText(input.deviceId, 200);
    const platform = normalizePlatform(input.platform);
    const appVersion = cleanOptionalText(input.appVersion, 80);
    const expiresAt = new Date(Date.now() + nonceTtlMs());
    const nonce = createNonce();
    await this.nonces.create({ nonce, deviceId, platform, appVersion, expiresAt });
    const handoffUrl = new URL('/auth/mobile-handoff', publicSiteUrl());
    handoffUrl.searchParams.set('nonce', nonce);
    return { nonce, expiresAt: expiresAt.toISOString(), handoffUrl: handoffUrl.toString() };
  }

  async exchangeHandoff(input: Record<string, unknown>): Promise<MobileAuthResponse> {
    const nonce = typeof input.nonce === 'string' ? input.nonce.trim() : '';
    const telegramAuth = input.telegramAuth as TelegramAuthData | undefined;
    if (!nonce || !telegramAuth) throw new MobileAuthValidationError('Nonce dan data Telegram wajib diisi');

    const row = await this.nonces.findValid(nonce);
    if (!row) throw new MobileAuthNonceInvalidError();

    const user = await this.membership.verifyLogin(telegramAuth);
    const session = await this.sessions.createSession(user.id);
    await this.nonces.markConsumed(nonce, user.id);

    return {
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      user,
      session: this.sessionInfo({
        id: session.sessionId,
        expiresAt: session.expiresAt,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      }, { deviceId: row.device_id, platform: row.platform, appVersion: row.app_version, current: true }),
      loginMechanism: 'telegram_external_browser_callback',
    };
  }

  async createTelegramSession(authData: TelegramAuthData): Promise<MobileAuthResponse> {
    const user = await this.membership.verifyLogin(authData);
    const session = await this.sessions.createSession(user.id);
    return {
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      user,
      loginMechanism: 'telegram_external_browser_callback',
    };
  }

  async buildMe(token: string, userId: string): Promise<MobileMeResponse> {
    const [validated, summary] = await Promise.all([
      this.sessions.validateToken(token),
      this.notifications.summary(userId),
    ]);
    if (!validated) throw new MobileAuthNonceInvalidError('Sesi tidak valid');
    return {
      user: validated.user,
      notifications: summary,
      session: this.sessionInfo({
        id: validated.sessionId,
        expiresAt: validated.expiresAt,
        createdAt: validated.createdAt,
        lastUsedAt: validated.lastUsedAt,
      }, { current: true }),
    };
  }

  async listSessions(userId: string, currentToken: string): Promise<MobileSessionListResponse> {
    const rows = await this.sessions.listActiveSessions(userId);
    const currentHash = hashMemberSessionToken(currentToken);
    const currentRow = await this.sessionRepo.findByTokenHash(currentHash);
    return {
      sessions: rows.map((row) => this.sessionInfo(row, { current: row.id === currentRow?.id })),
    };
  }

  async revokeSession(userId: string, sessionId: string, currentToken: string): Promise<void> {
    const current = await this.sessionRepo.findByTokenHash(hashMemberSessionToken(currentToken));
    if (current?.id === sessionId) throw new MobileAuthCurrentSessionRevokeError();
    await this.sessions.deleteSessionByIdForUser(sessionId, userId);
  }

  private sessionInfo(row: {
    id: string;
    expiresAt: Date;
    createdAt: Date;
    lastUsedAt: Date | null;
  }, meta: {
    deviceId?: string | null;
    platform?: MobilePlatform | null;
    appVersion?: string | null;
    current?: boolean;
  } = {}): MobileSessionInfo {
    return {
      id: row.id,
      deviceId: meta.deviceId ?? null,
      platform: meta.platform ?? null,
      appVersion: meta.appVersion ?? null,
      expiresAt: row.expiresAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: toIso(row.lastUsedAt),
      current: meta.current,
    };
  }
}

