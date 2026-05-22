'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { getAdminPageTitle } from './admin-routes';
import styles from './layout.module.css';

interface AdminHeaderProps {
  username: string;
  onMenuToggle: () => void;
}

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
          <Menu size={18} />
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
          <LogOut size={15} />
          {loggingOut ? 'Keluar...' : 'Keluar'}
        </button>
      </div>
    </header>
  );
}
