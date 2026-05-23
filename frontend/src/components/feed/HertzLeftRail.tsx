'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Compass, FileText, Hexagon, Home, MessageCircle, PanelLeft, PanelLeftClose, SlidersVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { canShowNavItem, getAccessRole } from '@/lib/accessRole';
import {
  LEFT_RAIL_WIDTH_COLLAPSED,
  LEFT_RAIL_WIDTH_EXPANDED,
  readLeftRailCollapsed,
  writeLeftRailCollapsed,
} from '@/lib/tools/catalog';
import { HertzAvatar } from './HertzAvatar';
import styles from './HertzRails.module.css';

type ActiveNav = 'home' | 'outlook' | 'blog' | 'gallery' | 'tools' | 'notifications' | 'messages' | 'profile';

const navItems = [
  { key: 'home', href: '/hertz', label: 'Home', Icon: Home },
  { key: 'outlook', href: '/outlook', label: 'Outlook', Icon: Compass },
  { key: 'blog', href: '/blog', label: 'Blog', Icon: FileText },
  { key: 'tools', href: '/tools', label: 'Tools', Icon: SlidersVertical },
  { key: 'messages', href: '/hertz/messages', label: 'Direct Message', Icon: MessageCircle },
] as const;

export function HertzLeftRail({
  currentUser,
  active = 'home',
}: {
  currentUser: MemberSessionUser | null;
  active?: ActiveNav;
}) {
  const accessRole = getAccessRole(currentUser);
  const visibleItems = navItems.filter(({ key }) => canShowNavItem(accessRole, key));
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(readLeftRailCollapsed());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const width = collapsed ? LEFT_RAIL_WIDTH_COLLAPSED : LEFT_RAIL_WIDTH_EXPANDED;
    document.documentElement.style.setProperty('--hertz-left-rail-width', width);
    writeLeftRailCollapsed(collapsed);
  }, [collapsed, hydrated]);

  function toggleCollapsed() {
    setCollapsed((value) => !value);
  }

  const asideClass = collapsed ? `${styles.left} ${styles.leftCollapsed}` : styles.left;

  return (
    <aside className={asideClass} aria-label="Horizon navigation">
      <div className={styles.brand}>
        <Image
          className={styles.brandLogo}
          src="/images/logo/Logo-Horizon-Atom-Online-White_8.png"
          alt="Horizon"
          width={42}
          height={42}
          priority
        />
        <strong className={styles.brandTitle}>HERTZ</strong>
      </div>
      <nav className={styles.nav}>
        {visibleItems.map(({ key, href, label, Icon }) => (
          <Link
            key={key}
            href={href}
            className={active === key ? styles.activeNav : undefined}
            prefetch
            title={label}
            aria-label={label}
          >
            <Icon aria-hidden="true" />
            <span className={styles.navLabel}>{label}</span>
          </Link>
        ))}
      </nav>
      {currentUser?.role === 'admin' ? (
        <Link
          href="/admin/hertz"
          className={styles.syncCard}
          prefetch={false}
          title="HERTZ sync active"
          aria-label="HERTZ sync active"
        >
          <span className={styles.syncDot} />
          <strong className={styles.syncCardTitle}>HERTZ sync active</strong>
          <span className={styles.syncCardHint}>Draft review queue</span>
        </Link>
      ) : null}
      {currentUser?.role === 'admin' ? (
        <Link
          href="/admin/hertz"
          className={styles.adminNav}
          prefetch={false}
          title="Admin"
          aria-label="Admin"
        >
          <Hexagon aria-hidden="true" />
          <span className={styles.navLabel}>Admin</span>
        </Link>
      ) : null}
      <Link
        href="/hertz/profile"
        className={`${styles.profile} ${active === 'profile' ? styles.activeProfile : ''}`}
        prefetch
        title={currentUser?.displayName ?? 'Guest'}
        aria-label={currentUser?.displayName ?? 'Guest profile'}
      >
        <HertzAvatar
          className={styles.avatar}
          src={currentUser?.avatarUrl}
          name={currentUser?.displayName ?? 'Guest'}
          username={currentUser?.username}
        />
        <div className={styles.profileMeta}>
          <strong>{currentUser?.displayName ?? 'Guest'}</strong>
          <span>{currentUser ? (currentUser.badge === 'admin' ? 'Admin' : 'Verified Member') : 'Mode baca'}</span>
        </div>
      </Link>
      <button
        type="button"
        className={styles.railToggle}
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
      >
        {collapsed ? <PanelLeft aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
      </button>
    </aside>
  );
}
