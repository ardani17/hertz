import { Compass, FileText, Home, MessageCircle, SlidersVertical, UserCircle } from 'lucide-react';
import type { MemberSessionUser } from '@shared/types';
import { canShowNavItem, getAccessRole } from '@/lib/accessRole';
import styles from './MobileBottomNav.module.css';

type ActiveNav = 'home' | 'outlook' | 'blog' | 'gallery' | 'tools' | 'messages' | 'profile';

const navItems = [
  { key: 'home', href: '/hertz', label: 'Home', Icon: Home },
  { key: 'outlook', href: '/outlook', label: 'Outlook', Icon: Compass },
  { key: 'blog', href: '/blog', label: 'Blog', Icon: FileText },
  { key: 'tools', href: '/tools', label: 'Tools', Icon: SlidersVertical },
  { key: 'messages', href: '/hertz/messages', label: 'DM', ariaLabel: 'Direct Message', Icon: MessageCircle },
  { key: 'profile', href: '/hertz/profile', label: 'Akun', Icon: UserCircle },
] as const;
// Gallery is intentionally dormant and stays out of navigation until re-enabled.

export function MobileBottomNav({
  active,
  currentUser = null,
}: {
  active: ActiveNav;
  currentUser?: MemberSessionUser | null;
}) {
  const accessRole = getAccessRole(currentUser);
  const visibleItems = navItems.filter(({ key }) => canShowNavItem(accessRole, key));

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
        </a>
      ))}
    </nav>
  );
}
