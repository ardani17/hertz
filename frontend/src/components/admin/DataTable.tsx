'use client';

import { ReactNode } from 'react';
import { DataTableBody } from './DataTable/DataTableBody';
import { DataTablePagination } from './DataTable/DataTablePagination';
import { DataTableToolbar } from './DataTable/DataTableToolbar';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  toolbarActions?: ReactNode;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  total,
  page,
  pageSize,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  filters,
  toolbarActions,
  emptyMessage = 'Tidak ada data.',
  loading,
}: DataTableProps<T>) {
  return (
    <div className={styles.tableContainer}>
      <DataTableToolbar
        searchValue={searchValue}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={onSearchChange}
        filters={filters}
        toolbarActions={toolbarActions}
      />
      <DataTableBody
        columns={columns}
        data={data}
        rowKey={rowKey}
        loading={loading}
        emptyMessage={emptyMessage}
      />
      <DataTablePagination total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const classMap: Record<string, string> = {
    published: styles.badgePublished,
    hidden: styles.badgeHidden,
    draft: styles.badgeDraft,
  };

  return (
    <span className={`${styles.badge} ${classMap[status] ?? styles.badgeDraft}`}>
      {status}
    </span>
  );
}
