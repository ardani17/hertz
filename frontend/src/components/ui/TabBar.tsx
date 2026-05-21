import Link from 'next/link';
import styles from './TabBar.module.css';

export interface TabBarItem {
  id: string;
  label: string;
  href: string;
  active?: boolean;
}

interface TabBarProps {
  items: TabBarItem[];
  ariaLabel: string;
  align?: 'start' | 'center';
  /** Feed sort bar: pill tabs on desktop, underline tabs on mobile (≤1024px). */
  variant?: 'pill' | 'feedSort';
}

export function TabBar({ items, ariaLabel, align = 'start', variant = 'pill' }: TabBarProps) {
  const tabListClass = [
    styles.tabList,
    align === 'center' ? styles.tabListCenter : '',
    variant === 'feedSort' ? styles.tabListFeedSort : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <nav aria-label={ariaLabel}>
      <ul className={tabListClass} role="tablist">
        {items.map((item) => (
          <li key={item.id} className={styles.tab} role="presentation">
            <Link
              href={item.href}
              className={item.active ? `${styles.tabLink} ${styles.tabLinkActive}` : styles.tabLink}
              role="tab"
              aria-selected={item.active ?? false}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
