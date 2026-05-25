import type { UserRole } from './index';

export const MEMBER_SESSION_COOKIE = 'hertz_member_session';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface MembershipCheckResult {
  isMember: boolean;
}

export interface MemberSessionUser {
  id: string;
  telegramId: number | null;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  badge: 'verified_member' | 'admin';
  verifiedMemberAt: string | null;
}

export interface TelegramMembership {
  id: string;
  user_id: string;
  telegram_id: number;
  group_id: number;
  is_member: boolean;
  checked_at: Date;
  last_verified_at: Date | null;
  raw_response: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}
