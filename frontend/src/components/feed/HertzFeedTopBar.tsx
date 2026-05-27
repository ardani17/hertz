'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MemberSessionUser } from '@shared/types';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import type { HertzFeedFilterPatch, HertzFeedFilters } from '@/lib/hertzFeedFilters';
import { BRAND_LOGO_ATOM_WHITE } from '@/lib/brandLogo';
import styles from './HertzFeedTopBar.module.css';

export function HertzFeedTopBar({
  filters,
  onFilterChange,
  currentUser,
}: {
  filters: HertzFeedFilters;
  onFilterChange: (patch: HertzFeedFilterPatch) => void;
  currentUser: MemberSessionUser | null;
}) {
  const sortItems = [
    { id: 'latest' as const, label: 'Untuk Anda', active: filters.sort === 'latest' },
    { id: 'trending' as const, label: 'Trending', active: filters.sort === 'trending' },
  ];

  return (
    <header className={styles.topBar}>
      <Link className={styles.mobileBrand} href="/hertz" aria-label="Hertz Home" prefetch>
        <Image
          src={BRAND_LOGO_ATOM_WHITE}
          alt=""
          width={34}
          height={34}
          priority
        />
        <span className={styles.mobileBrandTitle}>HERTZ</span>
      </Link>
      <nav className={styles.sortNav} aria-label="Urutan feed HERTZ">
        <ul className={styles.sortTabs} role="tablist">
          {sortItems.map((item) => (
            <li key={item.id} className={styles.sortTab} role="presentation">
              <button
                type="button"
                className={item.active ? `${styles.sortTabButton} ${styles.sortTabButtonActive}` : styles.sortTabButton}
                role="tab"
                aria-selected={item.active}
                onClick={() => onFilterChange({ sort: item.id })}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <NotificationBell currentUser={currentUser} className={styles.notificationBell} />
    </header>
  );
}
