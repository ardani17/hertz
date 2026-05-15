import { createHash } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { DeviceTokenValidationError } from '@shared/services/deviceTokenService';
import type { MemberSessionUser } from '@shared/types/membership';
import { apiError } from './apiResponse';
import { getBearerTokenFromRequest, getCurrentBearerMemberFromRequest } from './memberAuth';
import { checkRateLimit } from './rateLimit';

export const mobileRateLimits = {
  auth: { max: 12, windowMs: 10 * 60 * 1000, prefix: 'mobile-auth' },
  read: { max: 240, windowMs: 10 * 60 * 1000, prefix: 'mobile-read' },
  mutation: { max: 60, windowMs: 10 * 60 * 1000, prefix: 'mobile-mutation' },
  device: { max: 20, windowMs: 60 * 60 * 1000, prefix: 'mobile-device' },
} as const;

export interface MobileAuthContext {
  user: MemberSessionUser;
  token: string;
}

export function tokenFingerprint(token: string | null): string | null {
  if (!token) return null;
  return createHash('sha256').update(token).digest('hex').slice(0, 24);
}

export function checkMobileRateLimit(
  request: NextRequest,
  policy: keyof typeof mobileRateLimits,
  identity?: string | null,
): NextResponse | null {
  const bearerIdentity = tokenFingerprint(getBearerTokenFromRequest(request));
  return checkRateLimit(request, {
    ...mobileRateLimits[policy],
    key: identity ?? bearerIdentity,
  });
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
