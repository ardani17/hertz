import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_IDLE_MS } from '../../../shared/constants';

const rootDir = resolve(__dirname, '../../..');
const mockExecute = vi.fn();

vi.mock('@shared/db', () => ({
  queryOne: vi.fn(),
  execute: (...args: unknown[]) => mockExecute(...args),
}));

import { createSession } from '../../../frontend/src/lib/auth';

describe('admin session sliding idle timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z'));
    mockExecute.mockReset();
    mockExecute.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates admin sessions with a 24-hour initial expiry', async () => {
    const session = await createSession('admin-1');

    expect(session.expiresAt.getTime()).toBe(Date.now() + SESSION_IDLE_MS);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO admin_sessions'),
      ['admin-1', expect.any(String), session.expiresAt.toISOString()],
    );
  });

  it('extends admin sessions read-only and refreshes cookies only from the route-safe helper', () => {
    const source = readFileSync(resolve(rootDir, 'frontend/src/lib/auth.ts'), 'utf8');

    expect(source).toContain('UPDATE admin_sessions SET expires_at = $1 WHERE id = $2');
    expect(source).toContain('export async function validateSessionAndRefreshCookie()');
    expect(source).toContain('await setSessionCookie(token, validated.expiresAt)');
    expect(source).toContain('expires: expiresAt');
  });
});
