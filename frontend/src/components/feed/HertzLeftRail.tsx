'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Compass, FileText, Hexagon, Home, MessageCircle, SlidersVertical } from 'lucide-react';
import type { MemberSessionUser } from '@shared/types';
import { canShowNavItem, getAccessRole } from '@/lib/accessRole';
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
// Gallery is intentionally dormant and stays out of navigation until re-enabled.

export function HertzLeftRail({
  currentUser,
  active = 'home',
}: {
  currentUser: MemberSessionUser | null;
  active?: ActiveNav;
}) {
  const accessRole = getAccessRole(currentUser);
  const visibleItems = navItems.filter(({ key }) => canShowNavItem(accessRole, key));

  return (
    <aside className={styles.left} aria-label="Horizon navigation">
      <div className={styles.brand}>
        <Image
          className={styles.brandLogo}
          src="/images/logo/Logo-Horizon-Atom-Online-White_8.png"
          alt="Horizon"
          width={42}
          height={42}
          priority
        />
        <strong>HERTZ</strong>
      </div>
      <nav className={styles.nav}>
        {visibleItems.map(({ key, href, label, Icon }) => (
          <Link key={key} href={href} className={active === key ? styles.activeNav : undefined} prefetch>
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
      {currentUser?.role === 'admin' ? (
        <Link href="/admin/hertz" className={styles.syncCard} prefetch={false}>
          <span className={styles.syncDot} />
          <strong>HERTZ sync active</strong>
          <span>Draft review queue</span>
        </Link>
      ) : null}
      {currentUser?.role === 'admin' ? <Link href="/admin/hertz" className={styles.adminNav} prefetch={false}><Hexagon />Admin</Link> : null}
      <Link href="/hertz/profile" className={`${styles.profile} ${active === 'profile' ? styles.activeProfile : ''}`} prefetch>
        <HertzAvatar
          className={styles.avatar}
          src={currentUser?.avatarUrl}
          name={currentUser?.displayName ?? 'Guest'}
          username={currentUser?.username}
        />
        <div>
          <strong>{currentUser?.displayName ?? 'Guest'}</strong>
          <span>{currentUser ? (currentUser.badge === 'admin' ? 'Admin' : 'Verified Member') : 'Mode baca'}</span>
        </div>
      </Link>
    </aside>
  );
}
