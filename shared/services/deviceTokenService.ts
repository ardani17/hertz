import { DeviceTokenRepository, type DevicePlatform, type DeviceTokenRow } from '../repositories/deviceTokenRepository';

export class DeviceTokenValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeviceTokenValidationError';
  }
}

function validatePlatform(value: unknown): DevicePlatform {
  if (value === 'android' || value === 'ios' || value === 'expo') return value;
  throw new DeviceTokenValidationError('Platform harus android, ios, atau expo');
}

function cleanToken(value: unknown): string {
  const token = typeof value === 'string' ? value.trim() : '';
  if (!token) throw new DeviceTokenValidationError('Device token wajib diisi');
  if (token.length > 4096) throw new DeviceTokenValidationError('Device token terlalu panjang');
  return token;
}

function validateTokenForPlatform(platform: DevicePlatform, token: string): string {
  if (platform === 'expo' && !/^ExponentPushToken\[[A-Za-z0-9_-]+\]$/.test(token)) {
    throw new DeviceTokenValidationError('Expo push token tidak valid');
  }
  if ((platform === 'ios' || platform === 'android') && (token.length < 20 || /\s/.test(token))) {
    throw new DeviceTokenValidationError('Native push token tidak valid');
  }
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
    const platform = validatePlatform(input.platform);
    const token = cleanToken(input.token);
    return this.repo.upsert({
      userId,
      platform,
      token: validateTokenForPlatform(platform, token),
      deviceId: optionalText(input.deviceId, 200),
      appVersion: optionalText(input.appVersion, 80),
    });
  }

  async unregister(userId: string, input: Record<string, unknown>): Promise<void> {
    await this.repo.disableForUser(userId, cleanToken(input.token));
  }
}
