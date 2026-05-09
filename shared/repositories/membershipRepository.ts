import { queryOne, type DbClient } from '../db';
import type { User } from '../types';
import type { TelegramAuthData } from '../types/membership';

export interface MemberUserRow extends User {
  display_name: string | null;
  avatar_url: string | null;
  telegram_first_name: string | null;
  telegram_last_name: string | null;
  verified_member_at: Date | null;
  muted_until: Date | null;
  banned_at: Date | null;
}

export class MembershipRepository {
  async upsertTelegramUser(authData: TelegramAuthData, client?: DbClient): Promise<MemberUserRow> {
    const username = authData.username ?? authData.first_name ?? String(authData.id);
    const displayName = [authData.first_name, authData.last_name].filter(Boolean).join(' ') || username;

    const user = await queryOne<MemberUserRow>(
      `INSERT INTO users (
         telegram_id, username, role, display_name, avatar_url,
         telegram_first_name, telegram_last_name, verified_member_at
       )
       VALUES ($1, $2, 'member', $3, $4, $5, $6, NOW())
       ON CONFLICT (telegram_id)
       DO UPDATE SET
         username = COALESCE(EXCLUDED.username, users.username),
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url,
         telegram_first_name = EXCLUDED.telegram_first_name,
         telegram_last_name = EXCLUDED.telegram_last_name,
         verified_member_at = NOW()
       RETURNING id, telegram_id, username, password_hash, role, credit_balance, created_at,
                 display_name, avatar_url, telegram_first_name, telegram_last_name,
                 verified_member_at, muted_until, banned_at`,
      [
        authData.id,
        username,
        displayName,
        authData.photo_url ?? null,
        authData.first_name,
        authData.last_name ?? null,
      ],
      client,
    );

    if (!user) {
      throw new Error('Failed to upsert Telegram user');
    }

    return user;
  }

  async findUserById(userId: string, client?: DbClient): Promise<MemberUserRow | null> {
    return queryOne<MemberUserRow>(
      `SELECT id, telegram_id, username, password_hash, role, credit_balance, created_at,
              display_name, avatar_url, telegram_first_name, telegram_last_name,
              verified_member_at, muted_until, banned_at
       FROM users
       WHERE id = $1`,
      [userId],
      client,
    );
  }

  async upsertMembership(params: {
    userId: string;
    telegramId: number;
    groupId: number;
    isMember: boolean;
    rawResponse: Record<string, unknown>;
  }, client?: DbClient): Promise<void> {
    await queryOne(
      `INSERT INTO hertz_membership_checks (
         user_id, telegram_id, group_id, is_member, checked_at, last_verified_at, raw_response, updated_at
       )
       VALUES ($1, $2, $3, $4, NOW(), CASE WHEN $4 THEN NOW() ELSE NULL END, $5, NOW())
       ON CONFLICT (telegram_id, group_id)
       DO UPDATE SET
         user_id = EXCLUDED.user_id,
         is_member = EXCLUDED.is_member,
         checked_at = NOW(),
         last_verified_at = CASE WHEN EXCLUDED.is_member THEN NOW() ELSE hertz_membership_checks.last_verified_at END,
         raw_response = EXCLUDED.raw_response,
         updated_at = NOW()
       RETURNING id`,
      [
        params.userId,
        params.telegramId,
        params.groupId,
        params.isMember,
        JSON.stringify(params.rawResponse),
      ],
      client,
    );
  }

  async findRecentMembership(telegramId: number, groupId: number, maxAgeMs: number, client?: DbClient): Promise<{ is_member: boolean; checked_at: Date } | null> {
    return queryOne<{ is_member: boolean; checked_at: Date }>(
      `SELECT is_member, checked_at
       FROM hertz_membership_checks
       WHERE telegram_id = $1 AND group_id = $2 AND checked_at > NOW() - ($3::text)::interval`,
      [telegramId, groupId, `${Math.floor(maxAgeMs / 1000)} seconds`],
      client,
    );
  }
}
