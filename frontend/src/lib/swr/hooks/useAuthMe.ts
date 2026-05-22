'use client';

import type { MemberSessionUser } from '@shared/types';
import { useResource } from './useResource';

type AuthMeData = { user: MemberSessionUser | null };

export function useAuthMe() {
  return useResource<AuthMeData>('/api/auth/me');
}
