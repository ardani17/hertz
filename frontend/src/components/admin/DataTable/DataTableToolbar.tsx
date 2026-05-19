'use client';

import type { ReactNode } from 'react';
import type { FilterOption } from '../DataTable';
import styles from '../DataTable.module.css';

type DataTableToolbarProps = {
  searchValue?: string;
  searchPlaceholder: string;
  onSearchChange?: (value: string) => void;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  toolbarActions?: ReactNode;
};

export function DataTableToolbar({
  searchValue,
  searchPlaceholder,
  onSearchChange,
  filters,
  toolbarActions,
}: DataTableToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        {onSearchChange ? (
          <input
            type="search"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={searchValue ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search"
          />
        ) : null}
        {filters?.map((filter) => (
          <select
            key={filter.label}
            className={styles.filterSelect}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            aria-label={filter.label}
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>
      {toolbarActions ? <div>{toolbarActions}</div> : null}
    </div>
  );
}
