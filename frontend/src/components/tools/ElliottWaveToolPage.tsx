'use client';

import { ElliottWaveTool } from './ElliottWaveTool';
import { ToolNav } from './ToolNav';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

const pageCopy = {
  id: {
    eyebrow: 'Calculator',
    title: 'Elliott Wave Calculator',
    description:
      'Gunakan range periode sebelumnya dan harga saat ini untuk membuat level wave dan area observasi.',
    helpTitle: 'Cara membaca Elliott Wave Calculator',
    helpIntro:
      'Tool ini bukan pendeteksi wave otomatis penuh. Ia membuat level observasi dari range periode sebelumnya memakai rasio Fibonacci, lalu menandai area yang dekat dengan harga sekarang.',
    items: [
      {
        title: 'Previous high / low / close',
        body:
          'Masukkan high, low, dan close dari periode sebelumnya sesuai timeframe yang dipilih. Data ini menjadi range dasar untuk menghitung pivot dan level wave.',
      },
      {
        title: 'Harga sekarang',
        body:
          'Dipakai untuk mengecek apakah harga sedang dekat dengan support atau resistance wave. Jika terlalu jauh dari level, sinyal buy/sell tidak ditampilkan.',
      },
      {
        title: 'Timeframe',
        body:
          'Timeframe mengubah toleransi deteksi, risk, dan target. Daily lebih longgar untuk gerak pendek, sedangkan monthly memakai risk lebih lebar.',
      },
      {
        title: 'Area observasi',
        body:
          'Area buy/sell adalah zona observasi, bukan instruksi entry. Gunakan bersama struktur market, trend, likuiditas, dan manajemen risiko Anda.',
      },
    ],
  },
  en: {
    eyebrow: 'Calculator',
    title: 'Elliott Wave Calculator',
    description: 'Use the previous range and current price to build wave levels and observation areas.',
    helpTitle: 'How to read the Elliott Wave Calculator',
    helpIntro:
      'This is not a full automatic wave detector. It builds observation levels from the previous range using Fibonacci ratios, then marks areas close to the current price.',
    items: [
      {
        title: 'Previous high / low / close',
        body:
          'Enter the high, low, and close from the previous period according to the selected timeframe. This becomes the base range for pivot and wave levels.',
      },
      {
        title: 'Current price',
        body:
          'Used to check whether price is near a wave support or resistance. If price is too far from a level, buy/sell signals are hidden.',
      },
      {
        title: 'Timeframe',
        body:
          'The timeframe changes detection tolerance, risk, and target. Daily is looser for shorter moves, while monthly uses wider risk.',
      },
      {
        title: 'Observation area',
        body:
          'Buy/sell areas are observation zones, not entry instructions. Use them with market structure, trend, liquidity, and your own risk management.',
      },
    ],
  },
};

export function ElliottWaveToolPage() {
  const { language } = useToolsLanguage();
  const copy = pageCopy[language];

  return (
    <main className={styles.shell}>
      <ToolNav />
      <section className={styles.header}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <details className={styles.helpDetails}>
          <summary>{copy.helpTitle}</summary>
          <div className={styles.helpBody}>
            <p>{copy.helpIntro}</p>
            <div className={styles.helpGrid}>
              {copy.items.map((item) => (
                <article className={styles.helpItem} key={item.title}>
                  <h2>{item.title}</h2>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </details>
      </section>
      <ElliottWaveTool />
    </main>
  );
}
