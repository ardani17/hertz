'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';
import { Logo } from '@/components/ui/Logo';

const navSections = [
  {
    label: 'Utama',
    items: [
      { label: 'Dashboard', href: '/admin', icon: 'DB' },
      { label: 'HERTZ', href: '/admin/hertz', icon: 'HZ' },
      { label: 'Artikel', href: '/admin/articles', icon: 'AR' },
      { label: 'Outlook', href: '/admin/outlook', icon: 'OU' },
      { label: 'Blog', href: '/admin/blog', icon: 'BL' },
    ],
  },
  {
    label: 'Pengguna',
    items: [
      { label: 'User', href: '/admin/users', icon: 'US' },
      { label: 'Kredit', href: '/admin/credits', icon: 'CR' },
      { label: 'Komentar', href: '/admin/comments', icon: 'CM' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { label: 'Log', href: '/admin/logs', icon: 'LG' },
      { label: 'API Keys', href: '/admin/api-keys', icon: 'AK' },
    ],
  },
] as const;

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        aria-label="Navigasi admin"
      >
        <div className={styles.sidebarHeader}>
          <Link href="/admin" className={styles.sidebarLogo} onClick={onClose}>
            <Logo variant="compact" height={24} /> <span className={styles.sidebarBadge}>Admin</span>
          </Link>
        </div>

        <nav className={styles.sidebarNav}>
          {navSections.map((section) => (
            <div key={section.label} className={styles.navSection}>
              <div className={styles.navSectionLabel}>{section.label}</div>
              <ul className={styles.navList} role="list">
                {section.items.map((item) => (
                  <li key={item.href} className={styles.navItem}>
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
                      onClick={onClose}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <span className={styles.navIcon} aria-hidden="true">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backToSite}>
            Kembali ke situs
          </Link>
        </div>
      </aside>
    </>
  );
}
