import { UserRole, type MemberSessionUser } from '@shared/types';

export type HertzAccessRole = 'guest' | 'member' | 'admin';

export type HertzNavItem =
  | 'home'
  | 'outlook'
  | 'gallery'
  | 'tools'
  | 'notifications'
  | 'messages'
  | 'profile';

export function getAccessRole(currentUser: MemberSessionUser | null): HertzAccessRole {
  if (!currentUser) return 'guest';
  return currentUser.role === UserRole.ADMIN ? 'admin' : 'member';
}

export function canShowNavItem(role: HertzAccessRole, item: HertzNavItem): boolean {
  if (item === 'gallery') return false;
  if (role === 'guest' && item === 'tools') return false;
  return true;
}

export function canUseMemberAction(role: HertzAccessRole): boolean {
  return role === 'member' || role === 'admin';
}

export function canUseAdminAction(role: HertzAccessRole): boolean {
  return role === 'admin';
}
