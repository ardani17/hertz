import { queryOne } from '../db';
import { DeviceTokenRepository, type DeviceTokenRow } from '../repositories/deviceTokenRepository';
import { NotificationEventRepository } from '../repositories/notificationEventRepository';
import { PushRateLimiter } from '../infra/PushRateLimiter';

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

interface ExpoPushTicket {
  status?: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data?: ExpoPushTicket[];
  errors?: Array<{ message?: string }>;
}

export class PushNotificationService {
  private readonly devices = new DeviceTokenRepository();
  private readonly events = new NotificationEventRepository();
  private readonly limiter = new PushRateLimiter();

  async sendToUser(userId: string, input: PushInput): Promise<void> {
    const allowed = await this.limiter.consume(userId);
    if (!allowed) {
      await this.events.create({
        userId,
        eventType: input.eventType,
        title: input.title,
        body: input.body,
        payload: input.payload,
        status: 'skipped',
        errorMessage: 'rate_limited',
      });
      return;
    }

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
        body: 'Anda menerima pesan baru di Hertz.',
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

  async notifyHertzPulseCreated(params: { postId: string; actorUserId: string }): Promise<void> {
    try {
      const post = await queryOne<{ author_id: string; short_id: string }>(
        'SELECT author_id, short_id FROM hertz_posts WHERE id = $1',
        [params.postId],
      );
      if (!post || post.author_id === params.actorUserId) return;
      await this.sendToUser(post.author_id, {
        eventType: 'hertz.pulse.created',
        title: 'Pulse baru',
        body: 'Postingan HERTZ Anda mendapat pulse baru.',
        payload: {
          type: 'hertz_pulse',
          postId: post.short_id,
        },
      });
    } catch {
      // Push failures must not block the source workflow.
    }
  }

  async notifyHertzRepostCreated(params: { postId: string; actorUserId: string; repostPostId?: string | null }): Promise<void> {
    try {
      const post = await queryOne<{ author_id: string; short_id: string }>(
        'SELECT author_id, short_id FROM hertz_posts WHERE id = $1',
        [params.postId],
      );
      if (!post || post.author_id === params.actorUserId) return;
      await this.sendToUser(post.author_id, {
        eventType: 'hertz.repost.created',
        title: 'Repost baru',
        body: 'Postingan HERTZ Anda direpost.',
        payload: {
          type: 'hertz_repost',
          postId: post.short_id,
          repostPostId: params.repostPostId ?? null,
        },
      });
    } catch {
      // Push failures must not block the source workflow.
    }
  }

  async notifyHertzMention(params: { userId: string; actorUserId: string; targetType: string; targetId: string }): Promise<void> {
    if (params.userId === params.actorUserId) return;
    await this.sendToUser(params.userId, {
      eventType: 'hertz.mention',
      title: 'Mention baru',
      body: 'Anda disebut di HERTZ.',
      payload: {
        type: 'hertz_mention',
        targetType: params.targetType,
        targetId: params.targetId,
      },
    });
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

    if (process.env.PUSH_PROVIDER !== 'fcm_http_v1' && device.platform === 'expo') {
      await this.sendExpo(event.id, device, input);
      return;
    }

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
          await this.events.markInvalidToken(event.id, result.error);
          return;
        }
        await this.events.markFailed(event.id, result.error);
        return;
      }

      await this.events.markSent(event.id, result?.message_id ?? json.name ?? null);
    } catch (error) {
      await this.events.markFailed(event.id, error instanceof Error ? error.message : 'FCM send failed');
    }
  }

  private async sendExpo(eventId: string, device: DeviceTokenRow, input: PushInput): Promise<void> {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          to: device.token,
          title: input.title,
          body: input.body,
          data: stringifyPayload(input.payload ?? {}),
          sound: 'default',
        }),
      });
      const json = await response.json().catch(() => ({})) as ExpoPushResponse;
      if (!response.ok) {
        throw new Error(json.errors?.[0]?.message || `Expo Push HTTP ${response.status}`);
      }
      const ticket = json.data?.[0];
      if (ticket?.status === 'error') {
        const message = ticket.message || ticket.details?.error || 'Expo push failed';
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await this.devices.disableById(device.id);
          await this.events.markInvalidToken(eventId, message);
          return;
        }
        await this.events.markFailed(eventId, message);
        return;
      }
      await this.events.markSent(eventId, ticket?.id ?? null);
    } catch (error) {
      await this.events.markFailed(eventId, error instanceof Error ? error.message : 'Expo push failed');
    }
  }
}

function stringifyPayload(payload: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));
}
