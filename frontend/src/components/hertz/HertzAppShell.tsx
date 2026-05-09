import type { ReactNode } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { SignalLeftRail } from '@/components/feed/SignalLeftRail';
import { SignalRightRail } from '@/components/feed/SignalRightRail';
import styles from './HertzAppShell.module.css';

type ActiveNav = 'home' | 'outlook' | 'blog' | 'tools' | 'messages';

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
        <SignalLeftRail currentUser={currentUser} active={active} />
        <section className={styles.content}>
          <header className={styles.header}>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </section>
        {hideRightRail ? null : <SignalRightRail />}
      </div>
    </main>
  );
}
