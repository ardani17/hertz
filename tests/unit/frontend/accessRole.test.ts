import { describe, expect, it } from 'vitest';
import { UserRole, type MemberSessionUser } from '../../../shared/types';
import {
  canShowNavItem,
  canUseAdminAction,
  canUseMemberAction,
  getAccessRole,
} from '../../../frontend/src/lib/accessRole';

function makeUser(role: MemberSessionUser['role']): MemberSessionUser {
  return {
    id: `${role}-1`,
    telegramId: 17,
    username: role,
    displayName: role === UserRole.ADMIN ? 'Admin' : 'Member',
    avatarUrl: null,
    role,
    badge: role === UserRole.ADMIN ? 'admin' : 'verified_member',
    verifiedMemberAt: '2026-05-16T00:00:00.000Z',
  };
}

describe('HERTZ access role helper', () => {
  it('derives guest when no member session exists', () => {
    expect(getAccessRole(null)).toBe('guest');
  });

  it('derives member from a member session', () => {
    expect(getAccessRole(makeUser(UserRole.MEMBER))).toBe('member');
  });

  it('derives admin from an admin session', () => {
    expect(getAccessRole(makeUser(UserRole.ADMIN))).toBe('admin');
  });

  it('hides Tools navigation from guest while keeping DM and Profile visible as login CTA routes', () => {
    expect(canShowNavItem('guest', 'tools')).toBe(false);
    expect(canShowNavItem('guest', 'messages')).toBe(true);
    expect(canShowNavItem('guest', 'profile')).toBe(true);
  });

  it('allows member and admin to see Tools navigation', () => {
    expect(canShowNavItem('member', 'tools')).toBe(true);
    expect(canShowNavItem('admin', 'tools')).toBe(true);
  });

  it('gates member and admin actions by access role', () => {
    expect(canUseMemberAction('guest')).toBe(false);
    expect(canUseMemberAction('member')).toBe(true);
    expect(canUseMemberAction('admin')).toBe(true);

    expect(canUseAdminAction('guest')).toBe(false);
    expect(canUseAdminAction('member')).toBe(false);
    expect(canUseAdminAction('admin')).toBe(true);
  });
});
