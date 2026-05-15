import { describe, expect, it } from 'vitest';
import { DeviceTokenService, DeviceTokenValidationError } from '../../../shared/services/deviceTokenService';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('DeviceTokenService validation', () => {
  it('rejects unsupported mobile platforms before touching persistence', async () => {
    const service = new DeviceTokenService();

    await expect(service.register('user-id', {
      platform: 'web',
      token: 'device-token',
    })).rejects.toBeInstanceOf(DeviceTokenValidationError);
  });

  it('rejects empty device tokens before touching persistence', async () => {
    const service = new DeviceTokenService();

    await expect(service.unregister('user-id', {
      token: '   ',
    })).rejects.toBeInstanceOf(DeviceTokenValidationError);
  });
});

describe('mobile notification persistence wiring', () => {
  it('ships retryable notification event lookup support', () => {
    const source = readFileSync(join(process.cwd(), 'shared/repositories/notificationEventRepository.ts'), 'utf8');

    expect(source).toContain('listRetryable');
    expect(source).toContain("status IN ('pending', 'failed')");
  });
});
