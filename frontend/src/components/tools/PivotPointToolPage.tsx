'use client';

import { PivotPointTool } from './PivotPointTool';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

const pageCopy = {
  id: {
    eyebrow: 'Calculator',
    title: 'Pivot Point Calculator',
    description: 'Masukkan data OHLC periode sebelumnya untuk menghitung pivot, support, dan resistance.',
  },
  en: {
    eyebrow: 'Calculator',
    title: 'Pivot Point Calculator',
    description: 'Enter previous-period OHLC to calculate pivot, support, and resistance levels.',
  },
} as const;

export function PivotPointToolPage() {
  const { language } = useToolsLanguage();
  const copy = pageCopy[language];

  return (
    <section className={`${styles.shell} ${styles.wideShell}`}>
      <section className={styles.header}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </section>
      <PivotPointTool />
    </section>
  );
}
