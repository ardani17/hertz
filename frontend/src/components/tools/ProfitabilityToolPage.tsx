'use client';

import { ToolNav } from './ToolNav';
import { ProfitabilityTool } from './ProfitabilityTool';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

const pageCopy = {
  id: {
    eyebrow: 'Simulator',
    title: 'Profitability Simulator',
    description: 'Uji kombinasi risk, win rate, reward-risk, dan jumlah trade dalam ribuan skenario acak.',
    helpTitle: 'Penjelasan input simulator',
    helpIntro:
      'Buka bagian ini jika ingin memahami maksud setiap kolom sebelum menjalankan simulasi. Nilai yang Anda isi akan digunakan untuk membuat ribuan skenario acak, lalu tool menampilkan rata-rata, drawdown, dan rincian contoh trade.',
    items: [
      {
        title: 'Balance awal',
        body:
          'Modal awal yang menjadi titik mulai simulasi, mengikuti mata uang akun yang dipilih: IDR atau USD/USC. Semua risk per trade dihitung dari balance berjalan, bukan angka tetap. Contoh: jika balance awal 10.000.000 dan risk 2%, maka risk trade pertama adalah 200.000. Setelah balance naik atau turun, nominal risk berikutnya ikut berubah.',
      },
      {
        title: 'Risk per trade (%)',
        body:
          'Persentase modal yang dipertaruhkan pada setiap trade. Angka ini bukan ukuran lot langsung, tetapi batas risiko terhadap balance. Semakin besar risk per trade, hasil simulasi bisa naik lebih cepat, tetapi drawdown dan kemungkinan kerusakan modal juga membesar.',
      },
      {
        title: 'Win rate (%)',
        body:
          'Perkiraan persentase trade yang berakhir profit. Win rate 35% berarti dari 100 trade, sekitar 35 trade diasumsikan menang dan 65 kalah secara acak. Win rate harus dibaca bersama reward-risk, karena win rate rendah masih bisa profitable jika reward jauh lebih besar dari risiko.',
      },
      {
        title: 'Reward risk',
        body:
          'Perbandingan potensi profit terhadap risiko. Nilai 2 berarti setiap trade menang menghasilkan kira-kira dua kali risk. Jika risk trade adalah 200.000, maka trade menang menambah sekitar 400.000, sedangkan trade kalah mengurangi 200.000.',
      },
      {
        title: 'Jumlah trade',
        body:
          'Banyaknya trade dalam satu jalur simulasi. Jika diisi 100, setiap simulasi akan menjalankan 100 trade berurutan. Rincian trade di bawah hasil menampilkan salah satu jalur tersebut agar Anda bisa melihat perubahan balance dari trade ke trade.',
      },
      {
        title: 'Simulasi',
        body:
          'Jumlah skenario acak yang dijalankan. Semakin besar angka ini, semakin stabil gambaran statistiknya, tetapi proses bisa lebih berat. Metrik seperti Expected balance, Median, Best 10%, Worst 10%, dan Profitable dihitung dari kumpulan simulasi ini.',
      },
      {
        title: 'Drawdown',
        body:
          'Penurunan balance dari titik tertinggi sebelumnya. Contoh: jika balance sempat naik ke 1.000 lalu turun ke 900, drawdown-nya 10%. Avg drawdown menunjukkan rata-rata penurunan terdalam dari simulasi, sehingga membantu membaca tekanan risiko modal, bukan sekadar hasil akhir profit atau rugi.',
      },
    ],
  },
  en: {
    eyebrow: 'Simulator',
    title: 'Profitability Simulator',
    description: 'Test risk, win rate, reward-risk, and trade count across thousands of random scenarios.',
    helpTitle: 'Simulator input guide',
    helpIntro:
      'Open this section when you want to understand each field before running the simulation. Your inputs are used to generate thousands of random scenarios, then the tool shows averages, drawdown, and one sample trade path.',
    items: [
      {
        title: 'Starting balance',
        body:
          'The initial capital used as the starting point, following the selected account currency: IDR or USD/USC. Risk per trade is calculated from the running balance, not a fixed number. For example, with a starting balance of 10,000,000 and 2% risk, the first trade risks 200,000. As balance changes, the next risk amount changes too.',
      },
      {
        title: 'Risk per trade (%)',
        body:
          'The percentage of account balance risked on each trade. This is not lot size directly; it is the loss limit relative to balance. Higher risk can grow results faster, but also increases drawdown and account damage risk.',
      },
      {
        title: 'Win rate (%)',
        body:
          'The estimated percentage of trades that close in profit. A 35% win rate means roughly 35 out of 100 trades are assumed to win randomly. Read win rate together with reward-risk, because a lower win rate can still be profitable when winners are much larger than losers.',
      },
      {
        title: 'Reward-risk',
        body:
          'The profit-to-risk ratio. A value of 2 means each winning trade earns about twice the risk. If a trade risks 200,000, a win adds about 400,000 while a loss subtracts 200,000.',
      },
      {
        title: 'Trade count',
        body:
          'The number of trades in one simulation path. If set to 100, each simulation runs 100 sequential trades. The trade details below show one of those paths so you can inspect balance changes trade by trade.',
      },
      {
        title: 'Simulations',
        body:
          'The number of random scenarios to run. Higher values make the statistics more stable, but can be heavier. Metrics such as Expected balance, Median, Best 10%, Worst 10%, and Profitable are calculated from these simulations.',
      },
      {
        title: 'Drawdown',
        body:
          'The decline from the previous highest balance. For example, if balance reaches 1,000 and then falls to 900, the drawdown is 10%. Avg drawdown shows the average deepest decline across simulations, helping you read account pressure beyond the final profit or loss.',
      },
    ],
  },
};

export function ProfitabilityToolPage() {
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
      <ProfitabilityTool />
    </main>
  );
}
