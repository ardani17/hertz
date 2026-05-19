'use client';

import styles from '../DataTable.module.css';

type DataTablePaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function DataTablePagination({ total, page, pageSize, onPageChange }: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        {total === 0 ? 'Tidak ada data' : `Menampilkan ${startItem}–${endItem} dari ${total}`}
      </span>
      <div className={styles.paginationButtons}>
        <button
          type="button"
          className={`btn btn-secondary ${styles.paginationBtn}`}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
        >
          ← Prev
        </button>
        <button
          type="button"
          className={`btn btn-secondary ${styles.paginationBtn}`}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
