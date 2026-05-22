'use client';

import type { ReactNode } from 'react';
import type { Column } from '../DataTable';
import { AdminEmptyState } from '../AdminEmptyState';
import styles from '../DataTable.module.css';

type DataTableBodyProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage: string;
};

export function DataTableBody<T>({
  columns,
  data,
  rowKey,
  loading,
  emptyMessage,
}: DataTableBodyProps<T>) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={columns.length} className={styles.loadingCell}>
              Memuat data...
            </td>
          </tr>
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className={styles.emptyCell}>
              <AdminEmptyState title={emptyMessage} subtitle="Coba ubah filter atau tambahkan data baru." />
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key}>{col.render(row) as ReactNode}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
