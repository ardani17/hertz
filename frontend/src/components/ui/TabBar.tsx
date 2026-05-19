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
}

export function TabBar({ items, ariaLabel }: TabBarProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ul className={styles.tabList} role="tablist">
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
