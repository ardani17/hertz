'use client';

import { PUBLISHED_TOOLS } from '@/lib/tools/catalog';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';
import { useToolsSpa } from './ToolsSpaContext';

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
  const { activeTool, openHub, openTool } = useToolsSpa();
  const { language } = useToolsLanguage();
  const copy = navCopy[language];

  return (
    <nav className={styles.toolNav} aria-label={copy.aria}>
      <button
        type="button"
        className={activeTool === null ? styles.toolNavActive : undefined}
        aria-current={activeTool === null ? 'page' : undefined}
        onClick={openHub}
      >
        {copy.allTools}
      </button>
      {PUBLISHED_TOOLS.map((tool) => (
        <button
          key={tool.slug}
          type="button"
          className={activeTool === tool.slug ? styles.toolNavActive : undefined}
          aria-current={activeTool === tool.slug ? 'page' : undefined}
          onClick={() => openTool(tool.slug)}
        >
          {language === 'id' ? tool.labelId : tool.labelEn}
        </button>
      ))}
    </nav>
  );
}
