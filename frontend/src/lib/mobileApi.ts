import { createHash } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { DeviceTokenValidationError } from '@shared/services/deviceTokenService';
import type { MemberSessionUser } from '@shared/types/membership';
import { apiError } from './apiResponse';
import { getBearerTokenFromRequest, getCurrentBearerMemberFromRequest } from './memberAuth';
import { RedisRateLimiter } from '@/server/infra/RedisRateLimiter';

export const mobileRateLimits = {
  auth: { max: 12, windowMs: 10 * 60 * 1000, prefix: 'mobile-auth' },
  read: { max: 240, windowMs: 10 * 60 * 1000, prefix: 'mobile-read' },
  mutation: { max: 60, windowMs: 10 * 60 * 1000, prefix: 'mobile-mutation' },
  device: { max: 20, windowMs: 60 * 60 * 1000, prefix: 'mobile-device' },
  upload: { max: 30, windowMs: 10 * 60 * 1000, prefix: 'mobile-upload' },
} as const;

const redisRateLimiter = new RedisRateLimiter();

export interface MobileAuthContext {
  user: MemberSessionUser;
  token: string;
}

export function tokenFingerprint(token: string | null): string | null {
  if (!token) return null;
  return createHash('sha256').update(token).digest('hex').slice(0, 24);
}

export async function checkMobileRateLimit(
  request: NextRequest,
  policy: keyof typeof mobileRateLimits,
  identity?: string | null,
): Promise<NextResponse | null> {
  const bearerIdentity = tokenFingerprint(getBearerTokenFromRequest(request));
  return redisRateLimiter.consume(request, mobileRateLimits[policy], identity ?? bearerIdentity);
}

export const checkMobileRateLimitAsync = checkMobileRateLimit;

export function requireSupportedAppVersion(request: NextRequest): NextResponse | null {
  const minimum = process.env.MOBILE_MIN_APP_VERSION?.trim();
  if (!minimum) return null;
  const current = request.headers.get('app-version')?.trim();
  if (!current || compareSemver(current, minimum) >= 0) return null;
  return apiError('UPGRADE_REQUIRED', 'Versi aplikasi Anda tidak lagi didukung. Update ke versi terbaru.', 426, {
    minVersion: minimum,
    currentVersion: current,
  });
}

function compareSemver(a: string, b: string): number {
  const left = a.split('.').map((part) => Number(part) || 0);
  const right = b.split('.').map((part) => Number(part) || 0);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

export async function requireMobileMember(request: NextRequest): Promise<MobileAuthContext | NextResponse> {
  const result = await getCurrentBearerMemberFromRequest(request);
  if (!result.user || !result.token) {
    return apiError('AUTH_REQUIRED', 'Bearer token diperlukan', 401);
  }
  return { user: result.user, token: result.token };
}

export async function optionalMobileMember(request: NextRequest): Promise<MemberSessionUser | null> {
  const result = await getCurrentBearerMemberFromRequest(request);
  return result.user;
}

export function isMobileAuthContext(value: MobileAuthContext | NextResponse): value is MobileAuthContext {
  return 'user' in value && 'token' in value;
}

export function apiErrorFromMobileUnknown(error: unknown) {
  if (error instanceof DeviceTokenValidationError) {
    return apiError('VALIDATION_ERROR', error.message, 400);
  }
  return null;
}

export function withCache<T extends NextResponse>(response: T, value: string): T {
  response.headers.set('Cache-Control', value);
  return response;
}
