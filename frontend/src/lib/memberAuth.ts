import { cookies } from 'next/headers';
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
