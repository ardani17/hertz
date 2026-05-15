import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { MemberSessionService } from '@shared/services/memberSessionService';
import { MEMBER_SESSION_COOKIE } from '@shared/types/membership';
import type { MemberSessionUser } from '@shared/types/membership';

const sessionService = new MemberSessionService();

export async function getMemberSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(MEMBER_SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentMember(): Promise<MemberSessionUser | null> {
  const token = await getMemberSessionToken();
  return sessionService.validateToken(token);
}

export function parseBearerToken(authorization: string | null): string | null {
  const header = authorization?.trim();
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1]?.trim();
  if (!token || /\s/.test(token)) return null;
  return token;
}

export function getBearerTokenFromRequest(request: NextRequest): string | null {
  return parseBearerToken(request.headers.get('authorization'));
}

export interface MemberAuthResult {
  user: MemberSessionUser | null;
  token: string | null;
  source: 'cookie' | 'bearer' | null;
}

export async function resolveCurrentMemberFromRequest(
  request: NextRequest,
  options: { allowCookie?: boolean } = {},
): Promise<MemberAuthResult> {
  const allowCookie = options.allowCookie ?? true;
  if (allowCookie) {
    const cookieToken = request.cookies.get(MEMBER_SESSION_COOKIE)?.value ?? null;
    const cookieUser = await sessionService.validateToken(cookieToken);
    if (cookieUser) {
      return { user: cookieUser, token: cookieToken, source: 'cookie' };
    }
  }

  const bearerToken = getBearerTokenFromRequest(request);
  const bearerUser = await sessionService.validateToken(bearerToken);
  if (bearerUser) {
    return { user: bearerUser, token: bearerToken, source: 'bearer' };
  }

  return { user: null, token: null, source: null };
}

export async function getCurrentMemberFromRequest(request: NextRequest): Promise<MemberSessionUser | null> {
  const result = await resolveCurrentMemberFromRequest(request);
  return result.user;
}

export async function getCurrentBearerMemberFromRequest(request: NextRequest): Promise<MemberAuthResult> {
  return resolveCurrentMemberFromRequest(request, { allowCookie: false });
}

export async function setMemberSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MEMBER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearMemberSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MEMBER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function createMemberSessionCookie(userId: string): Promise<void> {
  const { token, expiresAt } = await sessionService.createSession(userId);
  await setMemberSessionCookie(token, expiresAt);
}

export async function deleteCurrentMemberSession(): Promise<void> {
  const token = await getMemberSessionToken();
  await sessionService.deleteSession(token);
  await clearMemberSessionCookie();
}
