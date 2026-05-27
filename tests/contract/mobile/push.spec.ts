import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, mockMemberSessionService, request, unmockCommon } from './helpers';

describe('mobile push contract', () => {
  afterEach(unmockCommon);

  it('registers device token envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/deviceTokenService', () => ({
      DeviceTokenService: vi.fn().mockImplementation(() => ({
        register: vi.fn(async () => ({
          id: 'device-token-1',
          platform: 'expo',
          device_id: 'device-1',
          app_version: '1.0.0',
          enabled: true,
          last_seen_at: new Date('2026-05-15T00:00:00.000Z'),
        })),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/notifications/register/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/notifications/register', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ platform: 'expo', token: 'ExponentPushToken[abc]', deviceId: 'device-1', appVersion: '1.0.0' }),
    })), 201);
    expect(body.data.deviceToken.id).toBe('device-token-1');
  });

  it('unregisters device token envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/deviceTokenService', () => ({
      DeviceTokenService: vi.fn().mockImplementation(() => ({
        unregister: vi.fn(async () => undefined),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/notifications/unregister/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/notifications/unregister', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ platform: 'expo', token: 'ExponentPushToken[abc]' }),
    })));
    expect(body.data.unregistered).toBe(true);
  });
});
