import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DeviceTokenRow } from '../../../shared/repositories/deviceTokenRepository';
import { ExpoPushAdapter, PushDeliveryService } from '../../../shared/services/notifications/PushDeliveryService';
import { FcmHttpV1Adapter } from '../../../shared/services/notifications/FcmHttpV1Adapter';

const device: DeviceTokenRow = {
  id: 'device-1',
  user_id: 'user-1',
  platform: 'expo',
  token: 'ExponentPushToken[abc123]',
  device_id: 'dev-1',
  app_version: '1.0.0',
  enabled: true,
  last_seen_at: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
};

describe('PushDeliveryService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.PUSH_PROVIDER;
  });

  it('uses Expo adapter for expo tokens by default', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: [{ status: 'ok', id: 'ticket-1' }] }),
    })) as unknown as typeof fetch);

    const service = new PushDeliveryService();
    const result = await service.send(device, { title: 'Hi', body: 'There' });
    expect(result.status).toBe('sent');
    expect(result.providerMessageId).toBe('ticket-1');
  });

  it('marks invalid expo tokens', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: [{ status: 'error', details: { error: 'DeviceNotRegistered' }, message: 'gone' }] }),
    })) as unknown as typeof fetch);

    const adapter = new ExpoPushAdapter();
    const result = await adapter.send(device, { title: 'Hi', body: 'There' });
    expect(result.status).toBe('invalid_token');
  });

  it('returns failed when FCM credentials are missing', async () => {
    delete process.env.FCM_PROJECT_ID;
    delete process.env.FCM_CLIENT_EMAIL;
    delete process.env.FCM_PRIVATE_KEY;
    const adapter = new FcmHttpV1Adapter();
    const result = await adapter.send({ ...device, platform: 'android', token: 'a'.repeat(140) }, { title: 'Hi', body: 'There' });
    expect(result.status).toBe('failed');
  });
});
