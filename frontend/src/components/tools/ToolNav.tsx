'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './ToolShell.module.css';

const links = [
  { href: '/tools/pivot-point', label: 'Pivot Point' },
  { href: '/tools/profitability', label: 'Profitability' },
  { href: '/tools/elliott-wave', label: 'Elliott Wave' },
  { href: '/tools/economic-calendar', label: 'Economic Calendar' },
  { href: '/tools/order-book', label: 'Order Book' },
  { href: '/tools/exchange-liquidity', label: 'Exchange Liquidity' },
  { href: '/tools/cftc', label: 'CFTC COT' },
];

export function ToolNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.toolNav} aria-label="Tools">
      <Link
        href="/tools"
        className={pathname === '/tools' ? styles.toolNavActive : styles.toolNavHome}
        aria-current={pathname === '/tools' ? 'page' : undefined}
      >
        Semua tools
      </Link>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? styles.toolNavActive : undefined}
          aria-current={pathname === link.href ? 'page' : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
