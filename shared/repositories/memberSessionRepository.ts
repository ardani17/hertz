import { execute, query, queryOne, type DbClient } from '../db';

export interface MemberSessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  last_used_at: Date | null;
  device_id: string | null;
  platform: string | null;
  app_version: string | null;
}

export class MemberSessionRepository {
  async create(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceId?: string | null;
    platform?: string | null;
    appVersion?: string | null;
  }, client?: DbClient): Promise<MemberSessionRow> {
    const row = await queryOne<MemberSessionRow>(
      `INSERT INTO hertz_member_sessions (user_id, token_hash, expires_at, last_used_at, device_id, platform, app_version)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6)
       RETURNING id, user_id, token_hash, expires_at, created_at, last_used_at, device_id, platform, app_version`,
      [
        params.userId,
        params.tokenHash,
        params.expiresAt.toISOString(),
        params.deviceId ?? null,
        params.platform ?? null,
        params.appVersion ?? null,
      ],
      client,
    );
    if (!row) throw new Error('Failed to create member session');
    return row;
  }

  async findByTokenHash(tokenHash: string, client?: DbClient): Promise<MemberSessionRow | null> {
    return queryOne<MemberSessionRow>(
      `SELECT id, user_id, token_hash, expires_at, created_at, last_used_at, device_id, platform, app_version
       FROM hertz_member_sessions
       WHERE token_hash = $1`,
      [tokenHash],
      client,
    );
  }

  async touchAndExtend(id: string, expiresAt: Date, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE hertz_member_sessions
       SET last_used_at = NOW(), expires_at = $2
       WHERE id = $1`,
      [id, expiresAt.toISOString()],
      client,
    );
  }

  async rotateTokenHash(id: string, tokenHash: string, expiresAt: Date, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE hertz_member_sessions
       SET token_hash = $2, expires_at = $3, last_used_at = NOW()
       WHERE id = $1`,
      [id, tokenHash, expiresAt.toISOString()],
      client,
    );
  }

  async updateMeta(id: string, params: {
    deviceId?: string | null;
    platform?: string | null;
    appVersion?: string | null;
  }, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE hertz_member_sessions
       SET device_id = COALESCE($2, device_id),
           platform = COALESCE($3, platform),
           app_version = COALESCE($4, app_version)
       WHERE id = $1`,
      [id, params.deviceId ?? null, params.platform ?? null, params.appVersion ?? null],
      client,
    );
  }

  async deleteByTokenHash(tokenHash: string, client?: DbClient): Promise<void> {
    await execute(
      'DELETE FROM hertz_member_sessions WHERE token_hash = $1',
      [tokenHash],
      client,
    );
  }

  async deleteExpired(client?: DbClient): Promise<void> {
    await execute(
      'DELETE FROM hertz_member_sessions WHERE expires_at < NOW()',
      [],
      client,
    );
  }

  async listActiveByUserId(userId: string, client?: DbClient): Promise<MemberSessionRow[]> {
    const result = await query<MemberSessionRow>(
      `SELECT id, user_id, token_hash, expires_at, created_at, last_used_at, device_id, platform, app_version
       FROM hertz_member_sessions
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY COALESCE(last_used_at, created_at) DESC`,
      [userId],
      client,
    );
    return result.rows;
  }

  async deleteByIdForUser(id: string, userId: string, client?: DbClient): Promise<void> {
    await execute(
      'DELETE FROM hertz_member_sessions WHERE id = $1 AND user_id = $2',
      [id, userId],
      client,
    );
  }
}
