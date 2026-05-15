'use client';

import { OrderBookTool } from './OrderBookTool';
import { ToolNav } from './ToolNav';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

const pageCopy = {
  id: {
    eyebrow: 'Live Data',
    title: 'Order Book',
    description: 'Lihat distribusi open orders atau positions untuk forex dan metals.',
    helpTitle: 'Cara membaca Order Book',
    helpIntro:
      'Tool ini menampilkan konsentrasi order atau posisi di sekitar harga saat ini dari upstream yang tersedia.',
    items: [
      {
        title: 'Instrumen',
        body: 'Pair atau metal yang ingin dibaca distribusi order/position-nya, seperti XAUUSD, EURUSD, atau USDJPY.',
      },
      {
        title: 'Open Orders',
        body: 'Melihat distribusi order tertunda di sekitar harga. Area dengan persentase besar bisa menjadi zona perhatian likuiditas.',
      },
      {
        title: 'Open Positions',
        body: 'Melihat distribusi posisi terbuka. Ini membantu membaca area keramaian posisi, bukan instruksi entry.',
      },
      {
        title: 'Long % dan Short %',
        body: 'Bar menunjukkan konsentrasi relatif pada tiap level harga. Angka ini harus dibaca bersama struktur market dan risk management.',
      },
    ],
  },
  en: {
    eyebrow: 'Live Data',
    title: 'Order Book',
    description: 'View open orders or open positions distribution for forex and metals.',
    helpTitle: 'How to read the Order Book',
    helpIntro:
      'This tool shows order or position concentration around current price from the available upstream.',
    items: [
      {
        title: 'Instrument',
        body: 'The pair or metal whose order/position distribution you want to inspect, such as XAUUSD, EURUSD, or USDJPY.',
      },
      {
        title: 'Open Orders',
        body: 'Shows pending order distribution around price. Higher percentage areas can become liquidity zones to watch.',
      },
      {
        title: 'Open Positions',
        body: 'Shows open position distribution. This helps inspect crowded positioning areas, not direct entry instructions.',
      },
      {
        title: 'Long % and Short %',
        body: 'Bars show relative concentration at each price level. Read them together with market structure and risk management.',
      },
    ],
  },
};

export function OrderBookToolPage() {
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
      <OrderBookTool />
    </main>
  );
}
