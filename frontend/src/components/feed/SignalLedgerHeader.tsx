import Image from 'next/image';
import type { MemberSessionUser } from '@shared/types';
import { ClockIcon, FilterIcon, SearchIcon } from './SignalIcons';
import styles from './SignalLedgerHeader.module.css';

const tabs = [
  { value: null, label: 'All', href: '/' },
  { value: 'trading', label: 'Trading Room', href: '/?category=trading' },
  { value: 'life_story', label: 'Life & Coffee', href: '/?category=life_story' },
  { value: 'general', label: 'General', href: '/?category=general' },
] as const;

export function SignalLedgerHeader({
  activeCategory,
  currentUser,
}: {
  activeCategory?: string | null;
  currentUser: MemberSessionUser | null;
}) {
  return (
    <div className={styles.header}>
      <div className={styles.top}>
        <div className={styles.mobileBrand}>
          <Image
            src="/images/logo/Logo-Horizon-White-05-05.png"
            alt="Horizon FX"
            width={112}
            height={38}
            priority
          />
        </div>
        <div>
          <h1>Signal Ledger</h1>
          <p>Telegram journals, chart setups, and community notes</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.mobileOnlyButton} aria-label="Search feed">
            <SearchIcon />
          </button>
          <a href="/" className={styles.iconButton} aria-label="Filter feed">
            <FilterIcon />
            <span>Filter</span>
          </a>
          <button type="button" className={styles.squareButton} aria-label="Sort by latest">
            <ClockIcon />
          </button>
          <a href={currentUser ? '/admin' : '#telegram-login'} className={styles.mobileProfile} aria-label={currentUser ? 'Open profile' : 'Login Telegram'}>
            {currentUser ? currentUser.displayName.slice(0, 1).toUpperCase() : 'Login'}
          </a>
        </div>
      </div>
      <nav className={styles.tabs} aria-label="Signal Ledger categories">
        {tabs.map((tab) => {
          const active = (tab.value ?? null) === (activeCategory ?? null);
          return (
            <a key={tab.label} href={tab.href} className={active ? styles.activeTab : ''}>
              {tab.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
