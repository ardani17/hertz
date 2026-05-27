import type { DeviceTokenRow } from '../../repositories/deviceTokenRepository';
import { isFcmHttpV1Configured } from './fcmAuth';
import { FcmHttpV1Adapter } from './FcmHttpV1Adapter';

export interface PushDeliveryInput {
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}

export interface PushSendResult {
  status: 'sent' | 'failed' | 'invalid_token';
  providerMessageId?: string | null;
  errorMessage?: string | null;
}

export interface PushAdapter {
  send(device: DeviceTokenRow, input: PushDeliveryInput): Promise<PushSendResult>;
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

function stringifyPayload(payload: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));
}

function isExpoPushToken(token: string): boolean {
  return /^ExponentPushToken\[[A-Za-z0-9_-]+\]$/.test(token);
}

export class ExpoPushAdapter implements PushAdapter {
  async send(device: DeviceTokenRow, input: PushDeliveryInput): Promise<PushSendResult> {
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
        return { status: 'failed', errorMessage: json.errors?.[0]?.message || `Expo Push HTTP ${response.status}` };
      }
      const ticket = json.data?.[0];
      if (ticket?.status === 'error') {
        const message = ticket.message || ticket.details?.error || 'Expo push failed';
        return {
          status: ticket.details?.error === 'DeviceNotRegistered' ? 'invalid_token' : 'failed',
          errorMessage: message,
        };
      }
      return { status: 'sent', providerMessageId: ticket?.id ?? null };
    } catch (error) {
      return { status: 'failed', errorMessage: error instanceof Error ? error.message : 'Expo push failed' };
    }
  }
}

export class PushDeliveryService {
  private readonly expo = new ExpoPushAdapter();
  private readonly fcm = new FcmHttpV1Adapter();

  resolve(device: DeviceTokenRow): PushAdapter {
    if (process.env.PUSH_PROVIDER === 'fcm_http_v1') return this.fcm;
    if ((device.platform === 'ios' || device.platform === 'android') && !isExpoPushToken(device.token) && isFcmHttpV1Configured()) {
      return this.fcm;
    }
    return this.expo;
  }

  async send(device: DeviceTokenRow, input: PushDeliveryInput): Promise<PushSendResult> {
    return this.resolve(device).send(device, input);
  }
}

export { FcmHttpV1Adapter } from './FcmHttpV1Adapter';
