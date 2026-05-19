'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

const navCopy = {
  id: {
    aria: 'Navigasi tools',
    allTools: 'Semua tools',
    links: {
      pivotPoint: 'Pivot Point',
      profitability: 'Profitability',
      elliottWave: 'Elliott Wave',
      economicCalendar: 'Kalender Ekonomi',
      orderBook: 'Order Book',
      exchangeLiquidity: 'Likuiditas Bursa',
      cftc: 'CFTC COT',
    },
  },
  en: {
    aria: 'Tools navigation',
    allTools: 'All tools',
    links: {
      pivotPoint: 'Pivot Point',
      profitability: 'Profitability',
      elliottWave: 'Elliott Wave',
      economicCalendar: 'Economic Calendar',
      orderBook: 'Order Book',
      exchangeLiquidity: 'Exchange Liquidity',
      cftc: 'CFTC COT',
    },
  },
};

const links = [
  { href: '/tools/pivot-point', key: 'pivotPoint' },
  { href: '/tools/profitability', key: 'profitability' },
  { href: '/tools/elliott-wave', key: 'elliottWave' },
  { href: '/tools/economic-calendar', key: 'economicCalendar' },
  { href: '/tools/order-book', key: 'orderBook' },
  { href: '/tools/exchange-liquidity', key: 'exchangeLiquidity' },
  { href: '/tools/cftc', key: 'cftc' },
] as const;

export function ToolNav() {
  const pathname = usePathname();
  const { language } = useToolsLanguage();
  const copy = navCopy[language];

  return (
    <nav className={styles.toolNav} aria-label={copy.aria}>
      <Link
        href="/tools"
        className={pathname === '/tools' ? styles.toolNavActive : styles.toolNavHome}
        aria-current={pathname === '/tools' ? 'page' : undefined}
      >
        {copy.allTools}
      </Link>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? styles.toolNavActive : undefined}
          aria-current={pathname === link.href ? 'page' : undefined}
        >
          {copy.links[link.key]}
        </Link>
      ))}
    </nav>
  );
}
