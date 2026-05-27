import { describe, expect, it } from 'vitest';
import { DeviceTokenService } from '../../../shared/services/deviceTokenService';

describe('mobile push register integration wiring', () => {
  it('validates expo token format before persistence', async () => {
    const service = new DeviceTokenService();
    await expect(service.register('user-1', {
      platform: 'expo',
      token: 'bad-token',
    })).rejects.toThrow();
  });
});
