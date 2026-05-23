'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PUBLISHED_TOOLS } from '@/lib/tools/catalog';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

const navCopy = {
  id: {
    aria: 'Navigasi tools',
    allTools: 'Semua tools',
  },
  en: {
    aria: 'Tools navigation',
    allTools: 'All tools',
  },
} as const;

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
      {PUBLISHED_TOOLS.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className={pathname === tool.href ? styles.toolNavActive : undefined}
          aria-current={pathname === tool.href ? 'page' : undefined}
        >
          {language === 'id' ? tool.labelId : tool.labelEn}
        </Link>
      ))}
    </nav>
  );
}
