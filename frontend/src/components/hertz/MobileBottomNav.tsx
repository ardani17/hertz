'use client';

import { useEffect, useState } from 'react';
import { Bell, Compass, FileText, Home, MessageCircle, SlidersVertical, UserCircle } from 'lucide-react';
import type { MemberSessionUser } from '@shared/types';
import { canShowNavItem, getAccessRole } from '@/lib/accessRole';
import styles from './MobileBottomNav.module.css';

type ActiveNav = 'home' | 'outlook' | 'blog' | 'gallery' | 'tools' | 'notifications' | 'messages' | 'profile';

const navItems = [
  { key: 'home', href: '/hertz', label: 'Home', Icon: Home },
  { key: 'outlook', href: '/outlook', label: 'Outlook', Icon: Compass },
  { key: 'blog', href: '/blog', label: 'Blog', Icon: FileText },
  { key: 'tools', href: '/tools', label: 'Tools', Icon: SlidersVertical },
  { key: 'notifications', href: '/hertz/notifications', label: 'Notif', ariaLabel: 'Notifikasi', Icon: Bell },
  { key: 'messages', href: '/hertz/messages', label: 'DM', ariaLabel: 'Direct Message', Icon: MessageCircle },
  { key: 'profile', href: '/hertz/profile', label: 'Akun', Icon: UserCircle },
] as const;
// Gallery is intentionally dormant and stays out of navigation until re-enabled.

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
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setUnreadDmCount(0);
      setUnreadNotificationCount(0);
      return;
    }

    let cancelled = false;
    async function loadNotifications() {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!cancelled && response.ok && payload?.success) {
        setUnreadDmCount(Number(payload.data.notifications?.unreadDmCount ?? 0));
        setUnreadNotificationCount(Number(payload.data.notifications?.unreadCount ?? 0));
      }
    }

    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 25000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [currentUser]);

  return (
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      {visibleItems.map(({ key, href, label, Icon, ...item }) => (
        <a
          key={key}
          href={href}
          className={active === key ? styles.active : undefined}
          aria-current={active === key ? 'page' : undefined}
          aria-label={'ariaLabel' in item ? item.ariaLabel : label}
        >
          <Icon />
          <span>{label}</span>
          {key === 'notifications' && getDmBadgeLabel(unreadNotificationCount) ? (
            <em className={styles.badge} aria-label={`${unreadNotificationCount} notifikasi belum dibaca`}>
              {getDmBadgeLabel(unreadNotificationCount)}
            </em>
          ) : null}
          {key === 'messages' && getDmBadgeLabel(unreadDmCount) ? (
            <em className={styles.badge} aria-label={`${unreadDmCount} DM belum dibaca`}>
              {getDmBadgeLabel(unreadDmCount)}
            </em>
          ) : null}
        </a>
      ))}
    </nav>
  );
}
