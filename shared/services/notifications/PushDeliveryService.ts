import type { DeviceTokenRow } from '../../repositories/deviceTokenRepository';

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

export class FcmHttpV1Adapter implements PushAdapter {
  async send(): Promise<PushSendResult> {
    return {
      status: 'failed',
      errorMessage: 'FCM HTTP v1 adapter is not implemented yet',
    };
  }
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

  resolve(): PushAdapter {
    if (process.env.PUSH_PROVIDER === 'fcm_http_v1') return this.fcm;
    return this.expo;
  }

  async send(device: DeviceTokenRow, input: PushDeliveryInput): Promise<PushSendResult> {
    return this.resolve().send(device, input);
  }
}

