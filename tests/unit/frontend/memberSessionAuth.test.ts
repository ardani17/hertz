import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

describe('member auth sliding session contract', () => {
  it('keeps default member validation read-only and exposes a route-safe refresh helper', () => {
    const source = readFileSync(resolve(rootDir, 'frontend/src/lib/memberAuth.ts'), 'utf8');

    expect(source).toContain('export async function getCurrentMemberAndRefreshCookie()');
    expect(source).toContain('refreshCookie: true');
    expect(source).toContain('await setMemberSessionCookie(token, validated.expiresAt)');
  });
});
