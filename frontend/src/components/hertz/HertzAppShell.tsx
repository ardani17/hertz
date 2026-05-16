'use client';

import type { ReactNode } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { HertzLeftRail } from '@/components/feed/HertzLeftRail';
import { HertzMobileMarket } from '@/components/feed/HertzMobileMarket';
import { HertzRightRail } from '@/components/feed/HertzRightRail';
import { MobileBottomNav } from './MobileBottomNav';
import styles from './HertzAppShell.module.css';

type ActiveNav = 'home' | 'outlook' | 'blog' | 'gallery' | 'tools' | 'messages' | 'profile';

export function HertzAppShell({
  active,
  title,
  description,
  currentUser,
  children,
  hideRightRail = false,
}: {
  active: ActiveNav;
  title: string;
  description: string;
  currentUser: MemberSessionUser | null;
  children: ReactNode;
  hideRightRail?: boolean;
}) {
  return (
    <main className={styles.main}>
      <div className={hideRightRail ? styles.shellCompact : styles.shell}>
        <HertzLeftRail currentUser={currentUser} active={active} />
        <section className={styles.content}>
          <header className={styles.header}>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {hideRightRail ? null : <HertzMobileMarket />}
          {children}
        </section>
        {hideRightRail ? null : <HertzRightRail />}
      </div>
      <MobileBottomNav active={active} />
    </main>
  );
}
