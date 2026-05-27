import { execute, query, queryOne, type DbClient } from '../db';

export type NotificationEventStatus = 'pending' | 'queued' | 'sent' | 'failed' | 'skipped' | 'invalid_token';

export interface NotificationEventRow {
  id: string;
  user_id: string;
  device_token_id: string | null;
  event_type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  provider: string;
  provider_message_id: string | null;
  status: NotificationEventStatus;
  error_message: string | null;
  created_at: Date;
  sent_at: Date | null;
  failed_at: Date | null;
}

export class NotificationEventRepository {
  async create(params: {
    userId: string;
    deviceTokenId?: string | null;
    eventType: string;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
    provider?: string;
    status?: NotificationEventStatus;
    errorMessage?: string | null;
  }, client?: DbClient): Promise<NotificationEventRow> {
    const row = await queryOne<NotificationEventRow>(
      `INSERT INTO notification_events (
         user_id, device_token_id, event_type, title, body, payload, provider, status, error_message,
         sent_at, failed_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9,
         CASE WHEN $8 = 'sent' THEN NOW() ELSE NULL END,
         CASE WHEN $8 = 'failed' THEN NOW() ELSE NULL END
       )
       RETURNING *`,
      [
        params.userId,
        params.deviceTokenId ?? null,
        params.eventType,
        params.title,
        params.body,
        JSON.stringify(params.payload ?? {}),
        params.provider ?? 'fcm',
        params.status ?? 'pending',
        params.errorMessage ?? null,
      ],
      client,
    );
    if (!row) throw new Error('Failed to create notification event');
    return row;
  }

  async markSent(eventId: string, providerMessageId?: string | null, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE notification_events
       SET status = 'sent', provider_message_id = $2, sent_at = NOW(), failed_at = NULL, error_message = NULL, attempt_count = attempt_count + 1
       WHERE id = $1`,
      [eventId, providerMessageId ?? null],
      client,
    );
  }

  async markFailed(eventId: string, errorMessage: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE notification_events
       SET status = 'failed', error_message = $2, failed_at = NOW(), attempt_count = attempt_count + 1
       WHERE id = $1`,
      [eventId, errorMessage],
      client,
    );
  }

  async markInvalidToken(eventId: string, errorMessage: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE notification_events
       SET status = 'invalid_token', error_message = $2, failed_at = NOW(), attempt_count = attempt_count + 1
       WHERE id = $1`,
      [eventId, errorMessage],
      client,
    );
  }

  async markSkipped(eventId: string, reason: string, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE notification_events
       SET status = 'skipped', error_message = $2
       WHERE id = $1`,
      [eventId, reason],
      client,
    );
  }

  async listRetryable(limit = 50, client?: DbClient): Promise<NotificationEventRow[]> {
    const result = await query<NotificationEventRow>(
      `SELECT *
       FROM notification_events
       WHERE status IN ('pending', 'failed')
       ORDER BY created_at ASC
       LIMIT $1`,
      [Math.min(Math.max(limit, 1), 200)],
      client,
    );
    return result.rows;
  }
}
