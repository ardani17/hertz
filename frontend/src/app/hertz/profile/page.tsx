import type { Metadata } from 'next';
import Link from 'next/link';
import { query, queryOne } from '@shared/db';
import type { CreditTransaction } from '@shared/types';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { HertzTelegramLogin } from '@/components/feed/HertzTelegramLogin';
import { getCurrentMember } from '@/lib/memberAuth';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Akun HERTZ',
  description: 'Profil member, status Telegram, dan ringkasan credit HERTZ.',
};

interface CreditRow {
  credit_balance: number;
}

async function getCreditSummary(userId: string | null) {
  if (!userId) return { balance: null, transactions: [] as CreditTransaction[] };
  try {
    const [balance, history] = await Promise.all([
      queryOne<CreditRow>('SELECT credit_balance FROM users WHERE id = $1', [userId]),
      query<CreditTransaction>(
        `SELECT id, user_id, amount, transaction_type, source_type, source_id, description, created_at
         FROM credit_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId],
      ),
    ]);
    return {
      balance: balance?.credit_balance ?? null,
      transactions: history.rows,
    };
  } catch {
    return { balance: null, transactions: [] as CreditTransaction[] };
  }
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default async function HertzProfilePage() {
  const currentUser = await getCurrentMember();
  const credit = await getCreditSummary(currentUser?.id ?? null);

  return (
    <HertzAppShell
      active="profile"
      title="Akun HERTZ"
      description="Status Telegram, credit, dan shortcut aktivitas member."
      currentUser={currentUser}
      hideRightRail
    >
      {!currentUser ? (
        <section className={styles.panel}>
          <span className={styles.badge}>Mode baca</span>
          <h2>Login Telegram untuk membuka akun HERTZ</h2>
          <p>Setelah login, status member dan credit akan tampil di halaman ini.</p>
          <HertzTelegramLogin />
        </section>
      ) : (
        <div className={styles.grid}>
          <section className={styles.panel}>
            <span className={styles.badge}>{currentUser.badge === 'admin' ? 'Admin' : 'Verified Member'}</span>
            <h2>{currentUser.displayName}</h2>
            <dl className={styles.metaList}>
              <div>
                <dt>Username</dt>
                <dd>{currentUser.username ? `@${currentUser.username}` : '-'}</dd>
              </div>
              <div>
                <dt>Telegram ID</dt>
                <dd>{currentUser.telegramId ?? '-'}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{currentUser.role}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{currentUser.verifiedMemberAt ? `Verified ${formatDate(currentUser.verifiedMemberAt)}` : 'Verified'}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.panel}>
            <span className={styles.badge}>Credit</span>
            <h2>{credit.balance ?? 0}</h2>
            <p>Saldo credit member yang tercatat di Horizon.</p>
            <div className={styles.actions}>
              <Link href="/hertz">Post saya</Link>
              <Link href="/tools">Tools</Link>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.historyPanel}`}>
            <span className={styles.badge}>Riwayat</span>
            <h2>Transaksi credit</h2>
            {credit.transactions.length > 0 ? (
              <div className={styles.historyList}>
                {credit.transactions.map((item) => (
                  <div key={item.id}>
                    <strong>{item.amount > 0 ? `+${item.amount}` : item.amount}</strong>
                    <span>{item.description ?? item.source_type}</span>
                    <em>{formatDate(item.created_at)}</em>
                  </div>
                ))}
              </div>
            ) : (
              <p>Belum ada riwayat credit yang bisa ditampilkan.</p>
            )}
          </section>
        </div>
      )}
    </HertzAppShell>
  );
}
