import { execute, query, queryOne, type DbClient } from '../db';

export type DevicePlatform = 'android' | 'ios' | 'expo';

export interface DeviceTokenRow {
  id: string;
  user_id: string;
  platform: DevicePlatform;
  token: string;
  device_id: string | null;
  app_version: string | null;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
  last_seen_at: Date;
}

export class DeviceTokenRepository {
  async upsert(params: {
    userId: string;
    platform: DevicePlatform;
    token: string;
    deviceId?: string | null;
    appVersion?: string | null;
  }, client?: DbClient): Promise<DeviceTokenRow> {
    const row = await queryOne<DeviceTokenRow>(
      `INSERT INTO device_tokens (user_id, platform, token, device_id, app_version, enabled, last_seen_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       ON CONFLICT (user_id, token)
       DO UPDATE SET
         platform = EXCLUDED.platform,
         device_id = EXCLUDED.device_id,
         app_version = EXCLUDED.app_version,
         enabled = true,
         updated_at = NOW(),
         last_seen_at = NOW()
       RETURNING *`,
      [params.userId, params.platform, params.token, params.deviceId ?? null, params.appVersion ?? null],
      client,
    );
    if (!row) throw new Error('Failed to upsert device token');
    return row;
  }

  async disableForUser(userId: string, token: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE device_tokens
       SET enabled = false, updated_at = NOW(), last_seen_at = NOW()
       WHERE user_id = $1 AND token = $2`,
      [userId, token],
      client,
    );
  }

  async disableById(id: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE device_tokens SET enabled = false, updated_at = NOW() WHERE id = $1`,
      [id],
      client,
    );
  }

  async listEnabledForUser(userId: string, client?: DbClient): Promise<DeviceTokenRow[]> {
    const result = await query<DeviceTokenRow>(
      `SELECT * FROM device_tokens
       WHERE user_id = $1 AND enabled = true
       ORDER BY last_seen_at DESC`,
      [userId],
      client,
    );
    return result.rows;
  }
}
