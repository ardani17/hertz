'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { HertzLeftRail } from '@/components/feed/HertzLeftRail';
import { HertzMobileMarket } from '@/components/feed/HertzMobileMarket';
import { HertzRightRail } from '@/components/feed/HertzRightRail';
import { MobileBottomNav } from '@/components/hertz/MobileBottomNav';
import styles from './HertzLayout.module.css';

export type HertzActiveNav =
  | 'home'
  | 'outlook'
  | 'blog'
  | 'gallery'
  | 'tools'
  | 'notifications'
  | 'messages'
  | 'profile';

type HertzLayoutBase = {
  active: HertzActiveNav;
  currentUser: MemberSessionUser | null;
  children: ReactNode;
  hideRightRail?: boolean;
  mobileMarketPosition?: 'before' | 'after' | 'hidden';
};

type HertzLayoutFeed = HertzLayoutBase & {
  variant: 'feed';
};

type HertzLayoutPage = HertzLayoutBase & {
  variant: 'page';
  title: string;
  description: string;
};

export type HertzLayoutProps = HertzLayoutFeed | HertzLayoutPage;

export function HertzLayout(props: HertzLayoutProps) {
  const {
    active,
    currentUser,
    children,
    hideRightRail = false,
    mobileMarketPosition = 'before',
  } = props;

  const showMobileMarketBefore = !hideRightRail && mobileMarketPosition === 'before';
  const showMobileMarketAfter = !hideRightRail && mobileMarketPosition === 'after';
  const contentClass =
    props.variant === 'feed'
      ? `${styles.content} ${styles.contentFeed}`
      : `${styles.content} ${styles.contentPage}`;

  return (
    <main className={styles.main}>
      <div className={hideRightRail ? styles.shellCompact : styles.shell}>
        <HertzLeftRail currentUser={currentUser} active={active} />
        <section className={contentClass} aria-label={props.variant === 'feed' ? 'HERTZ timeline' : undefined}>
          <header className={styles.mobileHeader}>
            <a className={styles.mobileBrand} href="/hertz" aria-label="HERTZ — Horizon feed">
              <Image
                src="/images/logo/Logo-Horizon-Atom-Online-White_8.png"
                alt=""
                width={34}
                height={34}
                priority
              />
              <span className={styles.mobileBrandTitle}>HERTZ</span>
            </a>
          </header>
          {props.variant === 'page' ? (
            <header className={styles.pageHeader}>
              <h1>{props.title}</h1>
              <p>{props.description}</p>
            </header>
          ) : null}
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
