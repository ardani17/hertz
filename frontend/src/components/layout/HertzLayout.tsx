'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { HertzLeftRail } from '@/components/feed/HertzLeftRail';
import { HertzMobileMarket } from '@/components/feed/HertzMobileMarket';
import { HertzRightRail } from '@/components/feed/HertzRightRail';
import { MobileBottomNav } from '@/components/hertz/MobileBottomNav';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import styles from './HertzLayout.module.css';

export type HertzActiveNav =
  | 'home'
  | 'outlook'
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
  hidePageHeader?: boolean;
  mobileMarketPosition?: 'before' | 'after' | 'hidden';
};

type HertzLayoutFeed = HertzLayoutBase & {
  variant: 'feed';
};

type HertzLayoutPage = HertzLayoutBase & {
  variant: 'page';
  title: string;
  description: string;
  /** DM / full-height tools: isi viewport, scroll hanya di panel anak */
  fillViewport?: boolean;
};

export type HertzLayoutProps = HertzLayoutFeed | HertzLayoutPage;

export function HertzLayout(props: HertzLayoutProps) {
  const {
    active,
    currentUser,
    children,
    hideRightRail = false,
    hidePageHeader = false,
    mobileMarketPosition = 'before',
  } = props;

  const showMobileMarketBefore = !hideRightRail && mobileMarketPosition === 'before';
  const showMobileMarketAfter = !hideRightRail && mobileMarketPosition === 'after';
  const fillViewport = props.variant === 'page' && props.fillViewport;
  const shellClass =
    hideRightRail && fillViewport
      ? styles.shellCompact
      : hideRightRail
        ? styles.shellNoRail
        : styles.shell;
  const contentClass =
    props.variant === 'feed'
      ? `${styles.content} ${styles.contentFeed}`
      : `${styles.content} ${styles.contentPage}${fillViewport ? ` ${styles.contentPageFill}` : ''}`;

  return (
    <main className={styles.main}>
      <div className={shellClass}>
        <HertzLeftRail currentUser={currentUser} active={active} />
        <section className={contentClass} aria-label={props.variant === 'feed' ? 'HERTZ timeline' : undefined}>
          {props.variant !== 'feed' ? (
            <>
              <header className={styles.desktopHeader}>
                <NotificationBell currentUser={currentUser} className={styles.desktopNotificationBell} />
              </header>
              <header className={styles.mobileHeader}>
                <Link className={styles.mobileBrand} href="/hertz" aria-label="Horizon Home" prefetch>
                  <Image
                    src="/images/logo/Logo-Horizon-Atom-Online-White_8.png"
                    alt=""
                    width={34}
                    height={34}
                    priority
                  />
                  <span className={styles.mobileBrandTitle}>HERTZ</span>
                </Link>
                <NotificationBell currentUser={currentUser} className={styles.mobileNotificationBell} />
              </header>
            </>
          ) : null}
          {props.variant === 'page' && !fillViewport && !hidePageHeader ? (
            <header className={styles.pageHeader}>
              <h1>{props.title}</h1>
              <p>{props.description}</p>
            </header>
          ) : null}
          {showMobileMarketBefore ? <HertzMobileMarket /> : null}
          {fillViewport ? <div className={styles.pageBodyFill}>{children}</div> : children}
          {showMobileMarketAfter ? <HertzMobileMarket /> : null}
        </section>
        {hideRightRail ? null : <HertzRightRail />}
      </div>
      <MobileBottomNav active={active} currentUser={currentUser} />
    </main>
  );
}
