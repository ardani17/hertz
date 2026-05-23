'use client';

import styles from '@/app/tools/tools.module.css';
import { PUBLISHED_TOOLS } from '@/lib/tools/catalog';
import { useToolsLanguage, type ToolsLanguage } from './useToolsLanguage';
import { useToolsSpa } from './ToolsSpaContext';

const copy = {
  id: {
    eyebrow: 'Horizon Tools',
    title: 'Kalkulator dan tracker trading untuk riset harian.',
    lede: 'Empat tool aktif untuk pivot, simulasi profit, challenge tracker, dan level Elliott.',
    languageLabel: 'Bahasa tools',
    indonesia: 'Indonesia',
    english: 'English',
    aria: 'Pilih bahasa tools',
  },
  en: {
    eyebrow: 'Horizon Tools',
    title: 'Trading calculators and trackers for daily research.',
    lede: 'Four active tools for pivot levels, profit simulation, challenge tracking, and Elliott levels.',
    languageLabel: 'Tools language',
    indonesia: 'Indonesia',
    english: 'English',
    aria: 'Choose tools language',
  },
} satisfies Record<
  ToolsLanguage,
  {
    eyebrow: string;
    title: string;
    lede: string;
    languageLabel: string;
    indonesia: string;
    english: string;
    aria: string;
  }
>;

export function ToolsHub() {
  const { language, setLanguage } = useToolsLanguage();
  const { openTool } = useToolsSpa();
  const current = copy[language];

  return (
    <div className={styles.main}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{current.eyebrow}</p>
          <h1>{current.title}</h1>
          {current.lede ? <p className={styles.lede}>{current.lede}</p> : null}
        </div>

        <div className={styles.languagePanel} aria-label={current.aria}>
          <span>{current.languageLabel}</span>
          <div className={styles.languageToggle}>
            <button
              className={language === 'id' ? styles.languageActive : ''}
              onClick={() => setLanguage('id')}
              type="button"
            >
              {current.indonesia}
            </button>
            <button
              className={language === 'en' ? styles.languageActive : ''}
              onClick={() => setLanguage('en')}
              type="button"
            >
              {current.english}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.grid} aria-label="Daftar tools">
        {PUBLISHED_TOOLS.map((tool) => (
          <button key={tool.slug} type="button" className={styles.toolCard} onClick={() => openTool(tool.slug)}>
            <span className={styles.toolLabel}>{language === 'id' ? tool.hubLabelId : tool.hubLabelEn}</span>
            <h2>{language === 'id' ? tool.cardLabelId : tool.cardLabelEn}</h2>
            <p>{language === 'id' ? tool.summaryId : tool.summaryEn}</p>
            <ul>
              {(language === 'id' ? tool.pointsId : tool.pointsEn).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </button>
        ))}
      </section>
    </div>
  );
}
