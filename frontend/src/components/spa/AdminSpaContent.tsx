'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SectionShell } from './SectionShell';
import styles from './AdminSpaContent.module.css';

/** Marks admin main content for SPA navigation; shell sidebar/header stay mounted. */
export function AdminSpaContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SectionShell section="admin">
      <div key={pathname} className={styles.pane}>
        {children}
      </div>
    </SectionShell>
  );
}
