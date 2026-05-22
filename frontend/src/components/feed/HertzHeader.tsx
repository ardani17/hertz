'use client';

import { type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import type { HertzFeedFilterPatch, HertzFeedFilters } from '@/lib/hertzFeedFilters';
import { SearchIcon } from './HertzIcons';
import styles from './HertzHeader.module.css';

export function HertzHeader({
  filters,
  onFilterChange,
}: {
  filters: HertzFeedFilters;
  onFilterChange: (patch: HertzFeedFilterPatch) => void;
}) {
  const sortItems = [
    { id: 'latest' as const, label: 'Untuk Anda', active: filters.sort === 'latest' },
    { id: 'trending' as const, label: 'Trending', active: filters.sort === 'trending' },
  ];

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextSearch = String(formData.get('q') ?? '').trim();
    onFilterChange({ search: nextSearch || null });
  }

  return (
    <div className={styles.header}>
      <div className={styles.navRow}>
        <nav aria-label="Urutan feed HERTZ">
          <ul className={`${styles.sortTabs} ${styles.sortTabsCenter}`} role="tablist">
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
      </div>
      <form className={styles.mobileSearch} onSubmit={handleSearchSubmit} role="search">
        <label className={styles.mobileSearchLabel} htmlFor="hertz-mobile-search">
          <SearchIcon />
          <span className={styles.srOnly}>Cari di HERTZ</span>
        </label>
        <input
          id="hertz-mobile-search"
          type="search"
          name="q"
          defaultValue={filters.search ?? ''}
          key={filters.search ?? 'empty-search'}
          placeholder="Cari postingan, member, pair..."
          autoComplete="off"
          enterKeyHint="search"
        />
      </form>
      {filters.search ? (
        <div className={styles.searchChip}>
          <span>Pencarian: {filters.search}</span>
          <Button type="button" variant="ghost" onClick={() => onFilterChange({ search: null })}>
            Hapus
          </Button>
        </div>
      ) : null}
    </div>
  );
}
