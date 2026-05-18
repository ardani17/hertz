'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { HertzLeftRail } from '@/components/feed/HertzLeftRail';
import { HertzMobileMarket } from '@/components/feed/HertzMobileMarket';
import { HertzRightRail } from '@/components/feed/HertzRightRail';
import { MobileBottomNav } from './MobileBottomNav';
import styles from './HertzAppShell.module.css';

type ActiveNav = 'home' | 'outlook' | 'blog' | 'gallery' | 'tools' | 'notifications' | 'messages' | 'profile';

export function HertzAppShell({
  active,
  title,
  description,
  currentUser,
  children,
  hideRightRail = false,
  mobileMarketPosition = 'before',
}: {
  active: ActiveNav;
  title: string;
  description: string;
  currentUser: MemberSessionUser | null;
  children: ReactNode;
  hideRightRail?: boolean;
  mobileMarketPosition?: 'before' | 'after' | 'hidden';
}) {
  const showMobileMarketBefore = !hideRightRail && mobileMarketPosition === 'before';
  const showMobileMarketAfter = !hideRightRail && mobileMarketPosition === 'after';

  return (
    <main className={styles.main}>
      <div className={hideRightRail ? styles.shellCompact : styles.shell}>
        <HertzLeftRail currentUser={currentUser} active={active} />
        <section className={styles.content}>
          <a className={styles.mobileBrand} href="/hertz" aria-label="Horizon Home">
            <Image
              src="/images/logo/Logo-Horizon-Atom-Online-White_8.png"
              alt="Horizon"
              width={34}
              height={34}
              priority
            />
          </a>
          <header className={styles.header}>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {showMobileMarketBefore ? <HertzMobileMarket /> : null}
          {children}
          {showMobileMarketAfter ? <HertzMobileMarket /> : null}
        </section>
        {hideRightRail ? null : <HertzRightRail />}
      </div>
      <MobileBottomNav active={active} currentUser={currentUser} />
    </main>
  );
}
