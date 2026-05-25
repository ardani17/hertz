import { createHash, createHmac } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import { hashMemberSessionToken } from '../../../shared/services/memberSessionService';
import { isTelegramAuthFresh, verifyTelegramAuthData } from '../../../shared/services/membershipService';
import type { TelegramAuthData } from '../../../shared/types/membership';

function signedTelegramPayload(botToken: string, overrides: Partial<TelegramAuthData> = {}): TelegramAuthData {
  const payload: Omit<TelegramAuthData, 'hash'> = {
    id: 5963323428,
    first_name: 'Hertz',
    last_name: 'Member',
    username: 'hertz_member',
    photo_url: 'https://example.com/avatar.jpg',
    auth_date: 1_800_000_000,
    ...overrides,
  };
  const dataCheckString = Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHash('sha256').update(botToken).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return { ...payload, hash };
}

describe('HERTZ Telegram auth', () => {
  it('accepts valid Telegram login widget signatures', () => {
    const botToken = '123456:test-token';
    const payload = signedTelegramPayload(botToken);

    expect(verifyTelegramAuthData(payload, botToken)).toBe(true);
  });

  it('rejects tampered Telegram login widget signatures', () => {
    const botToken = '123456:test-token';
    const payload = signedTelegramPayload(botToken, { username: 'original' });

    expect(verifyTelegramAuthData({ ...payload, username: 'tampered' }, botToken)).toBe(false);
  });

  it('rejects stale Telegram auth data', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-08T00:00:00Z'));

    expect(isTelegramAuthFresh(1_600_000_000)).toBe(false);

    vi.useRealTimers();
  });

  it('hashes member session tokens deterministically without storing raw token', () => {
    const token = 'member-session-token';
    const hash = hashMemberSessionToken(token);

    expect(hash).toBe(hashMemberSessionToken(token));
    expect(hash).not.toBe(token);
    expect(hash).toHaveLength(64);
  });
});
