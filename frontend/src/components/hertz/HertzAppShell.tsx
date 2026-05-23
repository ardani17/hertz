'use client';

import type { ReactNode } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { HertzLayout, type HertzActiveNav } from '@/components/layout/HertzLayout';

/** @deprecated Use HertzLayout directly. Kept for gradual migration. */
export function HertzAppShell({
  active,
  title,
  description,
  currentUser,
  children,
  hideRightRail = false,
  mobileMarketPosition = 'before',
  fillViewport = false,
}: {
  active: HertzActiveNav;
  title: string;
  description: string;
  currentUser: MemberSessionUser | null;
  children: ReactNode;
  hideRightRail?: boolean;
  mobileMarketPosition?: 'before' | 'after' | 'hidden';
  fillViewport?: boolean;
}) {
  return (
    <HertzLayout
      variant="page"
      active={active}
      title={title}
      description={description}
      currentUser={currentUser}
      hideRightRail={hideRightRail}
      mobileMarketPosition={mobileMarketPosition}
      fillViewport={fillViewport}
    >
      {children}
    </HertzLayout>
  );
}
