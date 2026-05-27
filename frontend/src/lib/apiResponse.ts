import { NextResponse } from 'next/server';
import {
  FeedForbiddenError,
  FeedNotFoundError,
  FeedValidationError,
  HertzForbiddenError,
  HertzNotFoundError,
  HertzValidationError,
} from '@shared/services/hertzPostService';
import {
  MobileAuthCurrentSessionRevokeError,
  MobileAuthNonceInvalidError,
  MobileAuthValidationError,
} from '@shared/services/mobileAuthService';
import { MobileMediaValidationError } from '@shared/services/mobileMediaService';
import { SessionDeviceMismatchError } from '@shared/services/memberSessionService';
import {
  DevTelegramLoginDisabledError,
  MembershipCheckUnavailableError,
  NotGroupMemberError,
  TelegramAuthInvalidError,
} from '@shared/services/membershipService';

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function normalizeErrorCode(code: string): string {
  if (code === 'AUTH_REQUIRED') return 'UNAUTHENTICATED';
  if (code === 'AUTH_INVALID') return 'UNAUTHENTICATED';
  if (code === 'AUTH_FORBIDDEN') return 'FORBIDDEN';
  if (code === 'RESOURCE_NOT_FOUND') return 'POST_NOT_FOUND';
  if (code === 'VALIDATION_ERROR') return 'VALIDATION_FAILED';
  if (code === 'RATE_LIMIT_EXCEEDED') return 'RATE_LIMITED';
  return code;
}

export function apiError(code: string, message: string, status: number, details: Record<string, unknown> | null = null) {
  const normalizedCode = normalizeErrorCode(code);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: normalizedCode,
        error_code: code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}

export function apiErrorFromUnknown(error: unknown) {
  if (error instanceof FeedValidationError || error instanceof HertzValidationError) {
    return apiError('VALIDATION_ERROR', error.message, 400);
  }
  if (error instanceof FeedForbiddenError || error instanceof HertzForbiddenError) {
    return apiError('AUTH_FORBIDDEN', error.message, 403);
  }
  if (error instanceof FeedNotFoundError || error instanceof HertzNotFoundError) {
    return apiError('RESOURCE_NOT_FOUND', error.message, 404);
  }
  if (error instanceof TelegramAuthInvalidError) {
    return apiError('AUTH_INVALID', error.message, 401);
  }
  if (error instanceof DevTelegramLoginDisabledError) {
    return apiError('FORBIDDEN', error.message, 403);
  }
  if (error instanceof NotGroupMemberError) {
    return apiError('NOT_GROUP_MEMBER', error.message, 403);
  }
  if (error instanceof MembershipCheckUnavailableError) {
    return apiError('MEMBERSHIP_CHECK_UNAVAILABLE', 'Verifikasi membership sedang tidak tersedia', 503);
  }
  if (error instanceof MobileAuthValidationError) {
    return apiError('VALIDATION_ERROR', error.message, 400);
  }
  if (error instanceof MobileAuthNonceInvalidError) {
    return apiError('AUTH_INVALID', error.message, 401);
  }
  if (error instanceof MobileAuthCurrentSessionRevokeError) {
    return apiError('CANNOT_REVOKE_CURRENT', error.message, 409);
  }
  if (error instanceof SessionDeviceMismatchError) {
    return apiError('SESSION_DEVICE_MISMATCH', error.message, 401);
  }
  if (error instanceof MobileMediaValidationError) {
    return apiError('VALIDATION_ERROR', error.message, 400);
  }
  return apiError('INTERNAL_ERROR', 'Terjadi kesalahan pada server', 500);
}
