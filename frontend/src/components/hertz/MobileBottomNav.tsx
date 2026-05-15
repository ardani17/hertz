import { Compass, FileText, Home, MessageCircle, SlidersVertical } from 'lucide-react';
import styles from './MobileBottomNav.module.css';

type ActiveNav = 'home' | 'outlook' | 'blog' | 'gallery' | 'tools' | 'messages';

const navItems = [
  { key: 'home', href: '/hertz', label: 'Home', Icon: Home },
  { key: 'outlook', href: '/outlook', label: 'Outlook', Icon: Compass },
  { key: 'blog', href: '/blog', label: 'Blog', Icon: FileText },
  { key: 'tools', href: '/tools', label: 'Tools', Icon: SlidersVertical },
  { key: 'messages', href: '/hertz/messages', label: 'Direct Message', Icon: MessageCircle },
] as const;

export function MobileBottomNav({ active }: { active: ActiveNav }) {
  return (
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      {navItems.map(({ key, href, label, Icon }) => (
        <a key={key} href={href} className={active === key ? styles.active : undefined} aria-current={active === key ? 'page' : undefined}>
          <Icon />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
