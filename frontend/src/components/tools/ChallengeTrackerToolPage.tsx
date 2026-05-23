'use client';

import { ChallengeTrackerTool } from './ChallengeTrackerTool';
import styles from './toolShellChallengeStyles';
import { HertzTelegramLogin } from '@/components/feed/HertzTelegramLogin';
import { useToolsLanguage } from './useToolsLanguage';

const pageCopy = {
  id: {
    eyebrow: 'Challenge',
    title: 'Challenge Tracker',
    description: 'Pantau target profit, drawdown, aturan evaluasi, risiko harian, dan jurnal trading agar akun tetap berada di zona aman.',
    loginTitle: 'Login member diperlukan',
    loginBody: 'Challenge Tracker menyimpan database akun dan jurnal per member Telegram. Silakan login via Telegram terlebih dahulu.',
    helpTitle: 'Penjelasan input challenge',
    helpIntro: 'Gunakan bagian Rules untuk memasukkan parameter akun. Overview dan Risk Monitor akan membaca aturan, saldo, equity, serta jurnal trade untuk menentukan status akun.',
    items: [
      ['Saldo & equity', 'Saldo awal adalah modal challenge. Saldo/equity saat ini dipakai untuk membaca P/L berjalan dan drawdown.'],
      ['Target profit', 'Target profit bisa diisi persen atau nominal. Nominal otomatis mengikuti saldo awal saat persen diisi.'],
      ['Risk limit', 'Max daily loss dan max overall drawdown menentukan status Aman, Waspada, Bahaya, atau Gagal.'],
      ['Rules challenge', 'Tipe akun, mode drawdown, minimum trading days, news trading, hold overnight/weekend, max lot, dan max risk per trade dicatat sebagai aturan evaluasi.'],
      ['Journal', 'Input trade manual menjadi sumber analytics, dashboard jurnal, discipline score, dan AI Review context.'],
      ['AI Review', 'MVP belum memanggil provider AI. Tool menyimpan persona, membuat context, dan menampilkan mock response.'],
    ],
  },
  en: {
    eyebrow: 'Challenge',
    title: 'Challenge Tracker',
    description: 'Track profit target, drawdown, evaluation rules, daily risk, and trade journal so the account stays in the safe zone.',
    loginTitle: 'Member login required',
    loginBody: 'Challenge Tracker stores account and journal data per Telegram member. Please log in with Telegram first.',
    helpTitle: 'Challenge input guide',
    helpIntro: 'Use Rules to enter account parameters. Overview and Risk Monitor read rules, balance, equity, and journal trades to determine account status.',
    items: [
      ['Balance & equity', 'Starting balance is challenge capital. Current balance/equity are used for running P/L and drawdown.'],
      ['Profit target', 'Profit target can be entered as percent or amount. Amount follows starting balance when percent is filled.'],
      ['Risk limit', 'Max daily loss and max overall drawdown determine Safe, Warning, Danger, or Failed status.'],
      ['Challenge rules', 'Account type, drawdown mode, minimum trading days, news trading, overnight/weekend hold, max lot, and max risk are recorded as evaluation rules.'],
      ['Journal', 'Manual trade input feeds analytics, journal dashboard, discipline score, and AI Review context.'],
      ['AI Review', 'MVP does not call an AI provider yet. It stores personas, builds context, and displays a mock response.'],
    ],
  },
};

export function ChallengeTrackerToolPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { language } = useToolsLanguage();
  const copy = pageCopy[language];

  return (
    <section className={`${styles.shell} ${styles.wideShell}`}>
      <section className={styles.header}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        <details className={styles.helpDetails}>
          <summary>{copy.helpTitle}</summary>
          <div className={styles.helpBody}>
            <p>{copy.helpIntro}</p>
            <div className={styles.helpGrid}>
              {copy.items.map(([title, body]) => (
                <article className={styles.helpItem} key={title}>
                  <h2>{title}</h2>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </details>
      </section>
      {isAuthenticated ? (
        <ChallengeTrackerTool />
      ) : (
        <section className={`${styles.emptyState} ${styles.loginPanel}`}>
          <h2>{copy.loginTitle}</h2>
          <p>{copy.loginBody}</p>
          <HertzTelegramLogin compact />
        </section>
      )}
    </section>
  );
}
