import { queryOne } from '../db';
import { DeviceTokenRepository, type DeviceTokenRow } from '../repositories/deviceTokenRepository';
import { NotificationEventRepository } from '../repositories/notificationEventRepository';

interface PushInput {
  eventType: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}

interface FcmResponse {
  name?: string;
  results?: Array<{ message_id?: string; error?: string }>;
  error?: unknown;
}

export class PushNotificationService {
  private readonly devices = new DeviceTokenRepository();
  private readonly events = new NotificationEventRepository();

  async sendToUser(userId: string, input: PushInput): Promise<void> {
    const tokens = await this.devices.listEnabledForUser(userId);
    if (tokens.length === 0) {
      await this.events.create({
        userId,
        eventType: input.eventType,
        title: input.title,
        body: input.body,
        payload: input.payload,
        status: 'skipped',
        errorMessage: 'No enabled device tokens',
      });
      return;
    }

    await Promise.all(tokens.map((device) => this.sendToDevice(device, input)));
  }

  async notifyDmMessageCreated(params: { conversationId: string; messageId: string; senderId: string }): Promise<void> {
    try {
      const recipient = await queryOne<{ user_id: string }>(
        `SELECT user_id
         FROM hertz_conversation_participants
         WHERE conversation_id = $1 AND user_id <> $2
         LIMIT 1`,
        [params.conversationId, params.senderId],
      );
      if (!recipient) return;
      await this.sendToUser(recipient.user_id, {
        eventType: 'dm.message.created',
        title: 'Pesan baru',
        body: 'Anda menerima pesan baru di Horizon.',
        payload: {
          type: 'dm',
          conversationId: params.conversationId,
          messageId: params.messageId,
        },
      });
    } catch {
      // Push failures must not block the source workflow.
    }
  }

  async notifyHertzCommentCreated(params: { postId: string; commentId: string; commenterId: string }): Promise<void> {
    try {
      const post = await queryOne<{ author_id: string; short_id: string }>(
        'SELECT author_id, short_id FROM hertz_posts WHERE id = $1',
        [params.postId],
      );
      if (!post || post.author_id === params.commenterId) return;
      await this.sendToUser(post.author_id, {
        eventType: 'hertz.comment.created',
        title: 'Komentar baru',
        body: 'Postingan HERTZ Anda mendapat komentar baru.',
        payload: {
          type: 'hertz_comment',
          postId: post.short_id,
          commentId: params.commentId,
        },
      });
    } catch {
      // Push failures must not block the source workflow.
    }
  }

  private async sendToDevice(device: DeviceTokenRow, input: PushInput): Promise<void> {
    const event = await this.events.create({
      userId: device.user_id,
      deviceTokenId: device.id,
      eventType: input.eventType,
      title: input.title,
      body: input.body,
      payload: input.payload,
    });

    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) {
      await this.events.markSkipped(event.id, 'FCM_SERVER_KEY is not configured');
      return;
    }

    try {
      const response = await fetch(process.env.FCM_ENDPOINT || 'https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: device.token,
          notification: {
            title: input.title,
            body: input.body,
          },
          data: input.payload ?? {},
        }),
      });
      const json = await response.json().catch(() => ({})) as FcmResponse;
      if (!response.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : `FCM HTTP ${response.status}`);
      }

      const result = json.results?.[0];
      if (result?.error) {
        if (['NotRegistered', 'InvalidRegistration'].includes(result.error)) {
          await this.devices.disableById(device.id);
        }
        await this.events.markFailed(event.id, result.error);
        return;
      }

      await this.events.markSent(event.id, result?.message_id ?? json.name ?? null);
    } catch (error) {
      await this.events.markFailed(event.id, error instanceof Error ? error.message : 'FCM send failed');
    }
  }
}
