import Image from 'next/image';
import type { MemberSessionUser } from '@shared/types';
import { BookmarkIcon, ImageIcon, InsightIcon, PulseIcon, UsersIcon } from './SignalIcons';
import styles from './SignalRails.module.css';

export function SignalLeftRail({ currentUser }: { currentUser: MemberSessionUser | null }) {
  return (
    <aside className={styles.left} aria-label="Horizon navigation">
      <div className={styles.brand}>
        <Image
          className={styles.brandLogo}
          src="/images/logo/Logo-Horizon-White-05-05.png"
          alt="Horizon FX"
          width={190}
          height={64}
          priority
        />
      </div>
      <nav className={styles.nav}>
        <a href="/" className={styles.activeNav}><PulseIcon />Signal Ledger</a>
        <a href="/outlook"><InsightIcon />Outlook</a>
        <a href="/blog"><BookmarkIcon />Blog</a>
        <a href="/tools"><UsersIcon />Tools</a>
        <a href="/gallery"><ImageIcon />Gallery</a>
      </nav>
      {currentUser?.role === 'admin' ? (
        <a href="/admin/signal-ledger" className={styles.syncCard}>
          <span className={styles.syncDot} />
          <strong>Telegram sync active</strong>
          <span>Draft review queue</span>
        </a>
      ) : null}
      <div className={styles.profile}>
        <div className={styles.avatar}>{(currentUser?.displayName ?? 'G').slice(0, 1).toUpperCase()}</div>
        <div>
          <strong>{currentUser?.displayName ?? 'Guest'}</strong>
          <span>{currentUser ? (currentUser.badge === 'admin' ? 'Admin' : 'Verified Member') : 'Read-only'}</span>
        </div>
      </div>
    </aside>
  );
}
