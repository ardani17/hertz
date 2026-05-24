'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Compass, FileText, Home, MessageCircle, SlidersVertical, UserCircle } from 'lucide-react';
import type { MemberSessionUser } from '@shared/types';
import { canShowNavItem, getAccessRole } from '@/lib/accessRole';
import styles from './MobileBottomNav.module.css';

type ActiveNav = 'home' | 'outlook' | 'blog' | 'gallery' | 'tools' | 'notifications' | 'messages' | 'profile';

const navItems = [
  { key: 'home', href: '/hertz', label: 'Home', Icon: Home },
  { key: 'outlook', href: '/outlook', label: 'Outlook', Icon: Compass },
  { key: 'blog', href: '/blog', label: 'Blog', Icon: FileText },
  { key: 'tools', href: '/tools', label: 'Tools', Icon: SlidersVertical },
  { key: 'messages', href: '/hertz/messages', label: 'DM', ariaLabel: 'Direct Message', Icon: MessageCircle },
  { key: 'profile', href: '/hertz/profile', label: 'Akun', Icon: UserCircle },
] as const;

export function getDmBadgeLabel(count: number) {
  if (count <= 0) return null;
  return count > 99 ? '99+' : String(count);
}

export function MobileBottomNav({
  active,
  currentUser = null,
}: {
  active: ActiveNav;
  currentUser?: MemberSessionUser | null;
}) {
  const accessRole = getAccessRole(currentUser);
  const visibleItems = navItems.filter(({ key }) => canShowNavItem(accessRole, key));
  const [unreadDmCount, setUnreadDmCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setUnreadDmCount(0);
      return;
    }

    let cancelled = false;
    async function loadUnreadCounts() {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!cancelled && response.ok && payload?.success) {
        setUnreadDmCount(Number(payload.data.notifications?.unreadDmCount ?? 0));
      }
    }

    void loadUnreadCounts();
    const timer = window.setInterval(() => void loadUnreadCounts(), 25000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [currentUser]);

  return (
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      {visibleItems.map(({ key, href, label, Icon, ...item }) => (
        <Link
          key={key}
          href={href}
          className={active === key ? styles.active : undefined}
          aria-current={active === key ? 'page' : undefined}
          aria-label={'ariaLabel' in item ? item.ariaLabel : label}
          prefetch={key === 'tools' ? false : undefined}
        >
          <Icon />
          <span>{label}</span>
          {key === 'messages' && getDmBadgeLabel(unreadDmCount) ? (
            <em className={styles.badge} aria-label={`${unreadDmCount} DM belum dibaca`}>
              {getDmBadgeLabel(unreadDmCount)}
            </em>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
