import type { DeviceTokenRow } from '../../repositories/deviceTokenRepository';
import type { PushAdapter, PushDeliveryInput, PushSendResult } from './PushDeliveryService';
import { getFcmAccessToken, getFcmProjectId } from './fcmAuth';

function stringifyPayload(payload: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));
}

export class FcmHttpV1Adapter implements PushAdapter {
  async send(device: DeviceTokenRow, input: PushDeliveryInput): Promise<PushSendResult> {
    const projectId = getFcmProjectId();
    const accessToken = await getFcmAccessToken();
    if (!projectId || !accessToken) {
      return { status: 'failed', errorMessage: 'FCM HTTP v1 credentials are not configured' };
    }

    try {
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: device.token,
            notification: {
              title: input.title,
              body: input.body,
            },
            data: stringifyPayload(input.payload ?? {}),
          },
        }),
      });
      const json = await response.json().catch(() => ({})) as {
        name?: string;
        error?: { message?: string; status?: string; details?: Array<{ errorCode?: string }> };
      };
      if (!response.ok) {
        const errorCode = json.error?.details?.[0]?.errorCode ?? json.error?.status;
        if (errorCode === 'UNREGISTERED' || errorCode === 'INVALID_ARGUMENT') {
          return { status: 'invalid_token', errorMessage: json.error?.message ?? 'Invalid FCM token' };
        }
        return { status: 'failed', errorMessage: json.error?.message ?? `FCM HTTP v1 ${response.status}` };
      }
      return { status: 'sent', providerMessageId: json.name ?? null };
    } catch (error) {
      return { status: 'failed', errorMessage: error instanceof Error ? error.message : 'FCM HTTP v1 send failed' };
    }
  }
}
