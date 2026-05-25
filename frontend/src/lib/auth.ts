// ============================================
// Horizon Trader Platform — Auth Utilities
// ============================================

import { createHash, randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { queryOne, execute } from '@shared/db';
import { SESSION_IDLE_MS } from '@shared/constants';
import type { User, AdminSession } from '@shared/types';

/** Cookie name for the admin session token */
export const SESSION_COOKIE_NAME = 'horizon_admin_session';

/**
 * Hash a session token using SHA-256.
 *
 * We store the hash in the database rather than the raw token,
 * so a database leak does not expose valid session tokens.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a new random session token.
 */
export function generateSessionToken(): string {
  return randomUUID();
}

/**
 * Create a new admin session in the database and return the raw token.
 *
 * The raw token is set as a cookie; only the hash is stored in the DB.
 */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_IDLE_MS);

  await execute(
    `INSERT INTO admin_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()],
  );

  return { token, expiresAt };
}

/**
 * Set the session cookie with HttpOnly + Secure + SameSite=Strict flags.
 */
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  });
}

/**
 * Clear the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Read the session token from the request cookie.
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Validate a session token and return the associated admin user.
 *
 * Returns null if the token is missing, invalid, expired, or the
 * user is not an admin.
 */
export async function validateSession(): Promise<User | null> {
  const token = await getSessionToken();
  const validated = await validateSessionToken(token);
  return validated?.user ?? null;
}

export async function validateSessionAndRefreshCookie(): Promise<User | null> {
  const token = await getSessionToken();
  const validated = await validateSessionToken(token);
  if (!validated || !token) return null;
  await setSessionCookie(token, validated.expiresAt);
  return validated.user;
}

async function validateSessionToken(token: string | null): Promise<{ user: User; expiresAt: Date } | null> {
  if (!token) return null;

  const tokenHash = hashToken(token);

  const session = await queryOne<AdminSession>(
    `SELECT id, user_id, token_hash, expires_at, created_at
     FROM admin_sessions
     WHERE token_hash = $1`,
    [tokenHash],
  );

  if (!session) return null;

  const expiresAt = session.expires_at instanceof Date
    ? session.expires_at
    : new Date(session.expires_at);

  if (expiresAt.getTime() < Date.now()) {
    await execute(
      `DELETE FROM admin_sessions WHERE id = $1`,
      [session.id],
    );
    return null;
  }

  const user = await queryOne<User>(
    `SELECT id, telegram_id, username, password_hash, role, credit_balance, created_at
     FROM users
     WHERE id = $1 AND role = $2`,
    [session.user_id, 'admin'],
  );

  if (!user) return null;

  const nextExpiresAt = new Date(Date.now() + SESSION_IDLE_MS);
  await execute(
    `UPDATE admin_sessions SET expires_at = $1 WHERE id = $2`,
    [nextExpiresAt.toISOString(), session.id],
  );

  return { user, expiresAt: nextExpiresAt };
}

/**
 * Delete a session from the database by its raw token.
 */
export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await execute(
    `DELETE FROM admin_sessions WHERE token_hash = $1`,
    [tokenHash],
  );
}
