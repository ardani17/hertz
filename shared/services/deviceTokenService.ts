import { DeviceTokenRepository, type DevicePlatform, type DeviceTokenRow } from '../repositories/deviceTokenRepository';

export class DeviceTokenValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeviceTokenValidationError';
  }
}

function validatePlatform(value: unknown): DevicePlatform {
  if (value === 'android' || value === 'ios') return value;
  throw new DeviceTokenValidationError('Platform harus android atau ios');
}

function cleanToken(value: unknown): string {
  const token = typeof value === 'string' ? value.trim() : '';
  if (!token) throw new DeviceTokenValidationError('Device token wajib diisi');
  if (token.length > 4096) throw new DeviceTokenValidationError('Device token terlalu panjang');
  return token;
}

function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, max);
}

export class DeviceTokenService {
  private readonly repo = new DeviceTokenRepository();

  async register(userId: string, input: Record<string, unknown>): Promise<DeviceTokenRow> {
    return this.repo.upsert({
      userId,
      platform: validatePlatform(input.platform),
      token: cleanToken(input.token),
      deviceId: optionalText(input.deviceId, 200),
      appVersion: optionalText(input.appVersion, 80),
    });
  }

  async unregister(userId: string, input: Record<string, unknown>): Promise<void> {
    await this.repo.disableForUser(userId, cleanToken(input.token));
  }
}
