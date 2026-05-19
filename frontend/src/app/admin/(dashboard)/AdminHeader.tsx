'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { getAdminPageTitle } from './admin-routes';
import styles from './layout.module.css';

interface AdminHeaderProps {
  username: string;
  onMenuToggle: () => void;
}

/**
 * Admin top bar with mobile menu toggle, admin user info, and logout button.
 */
export function AdminHeader({ username, onMenuToggle }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = getAdminPageTitle(pathname);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      // Even on error, redirect to login
      router.push('/admin/login');
    }
  }

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarLeft}>
        <button
          type="button"
          className={styles.menuToggle}
          onClick={onMenuToggle}
          aria-label="Buka navigasi admin"
        >
          Menu
        </button>
        <span className={styles.pageTitle}>{pageTitle}</span>
      </div>

      <div className={styles.topBarRight}>
        <div className={styles.adminInfo}>
          <span className={styles.adminName}>{username}</span>
          <span className={styles.adminRole}>Admin</span>
        </div>
        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? 'Keluar...' : 'Keluar'}
        </button>
      </div>
    </header>
  );
}
