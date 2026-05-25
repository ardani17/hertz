'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Compass,
  CreditCard,
  FileText,
  Hexagon,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './layout.module.css';
import { Logo } from '@/components/ui/Logo';

const navSections: {
  label: string;
  items: { label: string; href: string; Icon: LucideIcon }[];
}[] = [
  {
    label: 'Utama',
    items: [
      { label: 'Dashboard', href: '/admin', Icon: LayoutDashboard },
      { label: 'HERTZ', href: '/admin/hertz', Icon: Hexagon },
      { label: 'Artikel', href: '/admin/articles', Icon: FileText },
      { label: 'Outlook', href: '/admin/outlook', Icon: Compass },
    ],
  },
  {
    label: 'Pengguna',
    items: [
      { label: 'User', href: '/admin/users', Icon: Users },
      { label: 'Kredit', href: '/admin/credits', Icon: CreditCard },
      { label: 'Komentar', href: '/admin/comments', Icon: MessageSquare },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { label: 'Log', href: '/admin/logs', Icon: ScrollText },
      { label: 'API Keys', href: '/admin/api-keys', Icon: KeyRound },
    ],
  },
];

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
          <Link href="/admin" prefetch scroll={false} className={styles.sidebarLogo} onClick={onClose}>
            <Logo variant="compact" height={24} />
            <span className={styles.sidebarBadge}>Admin</span>
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
                      prefetch
                      scroll={false}
                      className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
                      onClick={onClose}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <span className={styles.navIcon} aria-hidden="true">
                        <item.Icon />
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
          <Link href="/hertz" className={styles.backToSite}>
            <ArrowLeft size={16} />
            Kembali ke HERTZ
          </Link>
          <Link href="/" className={styles.backToSiteSecondary}>
            <BarChart3 size={14} />
            Situs publik
          </Link>
        </div>
      </aside>
    </>
  );
}
