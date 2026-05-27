import { execute, queryOne, type DbClient } from '../db';

export type AuthHandoffPlatform = 'ios' | 'android';

export interface AuthHandoffNonceRow {
  nonce: string;
  device_id: string;
  platform: AuthHandoffPlatform;
  app_version: string | null;
  consumed_at: Date | null;
  user_id: string | null;
  expires_at: Date;
  created_at: Date;
}

export class AuthHandoffNonceRepository {
  async create(params: {
    nonce: string;
    deviceId: string;
    platform: AuthHandoffPlatform;
    appVersion?: string | null;
    expiresAt: Date;
  }, client?: DbClient): Promise<AuthHandoffNonceRow> {
    const row = await queryOne<AuthHandoffNonceRow>(
      `INSERT INTO auth_handoff_nonces (nonce, device_id, platform, app_version, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [params.nonce, params.deviceId, params.platform, params.appVersion ?? null, params.expiresAt.toISOString()],
      client,
    );
    if (!row) throw new Error('Failed to create auth handoff nonce');
    return row;
  }

  async findValid(nonce: string, client?: DbClient): Promise<AuthHandoffNonceRow | null> {
    return queryOne<AuthHandoffNonceRow>(
      `SELECT *
       FROM auth_handoff_nonces
       WHERE nonce = $1
         AND consumed_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [nonce],
      client,
    );
  }

  async markConsumed(nonce: string, userId: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE auth_handoff_nonces
       SET consumed_at = NOW(), user_id = $2
       WHERE nonce = $1`,
      [nonce, userId],
      client,
    );
  }
}

