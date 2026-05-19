'use client';

import { ToolNav } from './ToolNav';
import { ProfitabilityTool } from './ProfitabilityTool';
import styles from './toolShellProfitabilityStyles';
import { useToolsLanguage } from './useToolsLanguage';

const pageCopy = {
  id: {
    eyebrow: 'Simulator',
    title: 'Profitability Simulator',
    description: 'Uji risiko, win rate, reward-risk, preset strategi, dan zona bahaya dalam ribuan skenario acak.',
    helpTitle: 'Penjelasan input simulator',
    helpIntro:
      'Buka bagian ini jika ingin memahami maksud setiap kolom sebelum menjalankan simulasi. Nilai yang Anda isi akan digunakan untuk membuat ribuan skenario acak, lalu tool menampilkan insight strategi, rekomendasi risiko, zona bahaya, chart, dan rincian contoh trade.',
    items: [
      {
        title: 'Tujuan simulasi dan preset',
        body:
          'Tujuan simulasi membantu tool menilai hasil sesuai konteks: growth, drawdown rendah, prop firm safe, atau testing strategi. Preset cepat mengisi risiko, win rate, reward-risk, jumlah trade, dan simulasi sebagai titik awal; Anda tetap bisa mengubah angkanya sebelum menjalankan ulang.',
      },
      {
        title: 'Saldo awal',
        body:
          'Modal awal yang menjadi titik mulai simulasi, mengikuti mata uang akun yang dipilih: IDR atau USD/USC. Semua risiko per trade dihitung dari saldo berjalan, bukan angka tetap. Contoh: jika saldo awal 10.000.000 dan risiko 2%, maka risiko trade pertama adalah 200.000. Setelah saldo naik atau turun, nominal risiko berikutnya ikut berubah.',
      },
      {
        title: 'Risiko per trade (%)',
        body:
          'Persentase modal yang dipertaruhkan pada setiap trade. Angka ini bukan ukuran lot langsung, tetapi batas risiko terhadap saldo. Semakin besar risiko per trade, hasil simulasi bisa naik lebih cepat, tetapi drawdown dan kemungkinan kerusakan modal juga membesar.',
      },
      {
        title: 'Win rate (%)',
        body:
          'Perkiraan persentase trade yang berakhir profit. Win rate 35% berarti dari 100 trade, sekitar 35 trade diasumsikan menang dan 65 kalah secara acak. Win rate harus dibaca bersama reward-risk, karena win rate rendah masih bisa profitable jika reward jauh lebih besar dari risiko.',
      },
      {
        title: 'Rasio reward-risk',
        body:
          'Perbandingan potensi profit terhadap risiko. Nilai 2 berarti setiap trade menang menghasilkan kira-kira dua kali risiko. Jika risiko trade adalah 200.000, maka trade menang menambah sekitar 400.000, sedangkan trade kalah mengurangi 200.000.',
      },
      {
        title: 'Jumlah trade',
        body:
          'Banyaknya trade dalam satu jalur simulasi. Jika diisi 100, setiap simulasi akan menjalankan 100 trade berurutan. Rincian trade di bawah hasil menampilkan salah satu jalur tersebut agar Anda bisa melihat perubahan saldo dari trade ke trade.',
      },
      {
        title: 'Simulasi',
        body:
          'Jumlah skenario acak yang dijalankan. Semakin besar angka ini, semakin stabil gambaran statistiknya, tetapi proses bisa lebih berat. Metrik seperti estimasi saldo, median, 10% terbaik, 10% terburuk, dan peluang profit dihitung dari kumpulan simulasi ini.',
      },
      {
        title: 'Drawdown',
        body:
          'Penurunan saldo dari titik tertinggi sebelumnya. Contoh: jika saldo sempat naik ke 1.000 lalu turun ke 900, drawdown-nya 10%. Rata-rata drawdown menunjukkan rata-rata penurunan terdalam dari simulasi, sehingga membantu membaca tekanan risiko modal, bukan sekadar hasil akhir profit atau rugi.',
      },
    ],
  },
  en: {
    eyebrow: 'Simulator',
    title: 'Profitability Simulator',
    description: 'Test risk, win rate, reward-risk, strategy presets, and danger zones across thousands of random scenarios.',
    helpTitle: 'Simulator input guide',
    helpIntro:
      'Open this section when you want to understand each field before running the simulation. Your inputs generate thousands of random scenarios, then the tool shows strategy insight, risk recommendation, danger zones, charts, and one sample trade path.',
    items: [
      {
        title: 'Simulation goal and presets',
        body:
          'The simulation goal helps the tool judge results by context: growth, low drawdown, prop firm safe, or strategy testing. Quick presets fill risk, win rate, reward-risk, trade count, and simulations as a starting point; you can still edit the numbers before rerunning.',
      },
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
    <section className={styles.shell}>
      <ToolNav />
      <section className={styles.header}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
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
    </section>
  );
}
