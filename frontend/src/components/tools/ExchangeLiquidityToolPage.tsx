'use client';

import { ExchangeLiquidityTool } from './ExchangeLiquidityTool';
import { ToolNav } from './ToolNav';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

const pageCopy = {
  id: {
    eyebrow: 'Live Data',
    title: 'Exchange Liquidity',
    description: 'Lihat klaster likuidasi leverage berdasarkan exchange, pair, dan range waktu.',
    helpTitle: 'Cara membaca Exchange Liquidity',
    helpIntro:
      'Tool ini menampilkan perkiraan level harga yang memiliki konsentrasi likuidasi leverage. Data kosong bisa terjadi jika upstream tidak menyediakan map untuk kombinasi exchange, pair, atau range tertentu.',
    items: [
      {
        title: 'Exchange',
        body: 'Pilih exchange yang ingin diamati. Nama exchange mengikuti format upstream dan sebagian disamarkan.',
      },
      {
        title: 'Pair',
        body: 'Pilih pasangan crypto, misalnya BTC/USDT atau ETH/USDT. Pair menentukan harga saat ini dan level likuidasi yang ditampilkan.',
      },
      {
        title: 'Range',
        body: 'Range menentukan jendela waktu map likuidasi. Range lebih panjang bisa memberi gambaran area yang lebih luas.',
      },
      {
        title: 'Liquidation level',
        body: 'Bar menunjukkan estimasi konsentrasi likuidasi pada level harga. Level besar adalah area observasi, bukan sinyal entry otomatis.',
      },
    ],
  },
  en: {
    eyebrow: 'Live Data',
    title: 'Exchange Liquidity',
    description: 'View leveraged liquidation clusters by exchange, pair, and time range.',
    helpTitle: 'How to read Exchange Liquidity',
    helpIntro:
      'This tool shows estimated price levels with leveraged liquidation concentration. Empty data can happen when the upstream has no map for a specific exchange, pair, or range.',
    items: [
      {
        title: 'Exchange',
        body: 'Choose the exchange to inspect. Exchange names follow the upstream format and some are partially masked.',
      },
      {
        title: 'Pair',
        body: 'Choose the crypto pair, such as BTC/USDT or ETH/USDT. The pair determines current price and displayed liquidation levels.',
      },
      {
        title: 'Range',
        body: 'The range controls the time window of the liquidation map. Longer ranges can reveal broader observation areas.',
      },
      {
        title: 'Liquidation level',
        body: 'Bars show estimated liquidation concentration at each price level. Larger levels are observation areas, not automatic entry signals.',
      },
    ],
  },
};

export function ExchangeLiquidityToolPage() {
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
      <ExchangeLiquidityTool />
    </main>
  );
}
