import type { Metadata } from 'next';
import Link from 'next/link';
import { query, queryOne } from '@shared/db';
import type { CreditTransaction } from '@shared/types';
import { buildProfileActivityTabs, HertzProfileService, type HertzProfileActivity } from '@shared/services/hertzProfileService';
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

async function getActivity(userId: string | null): Promise<HertzProfileActivity | null> {
  if (!userId) return null;
  try {
    return await new HertzProfileService().getActivity(userId);
  } catch {
    return { posts: [], saved: [], reposts: [], comments: [] };
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

function ActivitySection({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: HertzProfileActivity['posts'];
}) {
  return (
    <div className={styles.activitySection}>
      <h3>{title}</h3>
      <div className={styles.activityGrid}>
        {items.length > 0 ? items.map((item) => (
          <Link key={item.id} href={`/hertz/post/${item.shortId}`}>
            <span>{item.label}</span>
            <strong>{item.text || 'Postingan HERTZ'}</strong>
            <em>{formatDate(item.createdAt)}</em>
          </Link>
        )) : <p>{empty}</p>}
      </div>
    </div>
  );
}

export default async function HertzProfilePage() {
  const currentUser = await getCurrentMember();
  const credit = await getCreditSummary(currentUser?.id ?? null);
  const activity = await getActivity(currentUser?.id ?? null);
  const tabs = activity ? buildProfileActivityTabs(activity) : [];

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
          {activity ? (
            <section className={`${styles.panel} ${styles.historyPanel}`}>
              <span className={styles.badge}>Aktivitas</span>
              <h2>Aktivitas HERTZ</h2>
              <div className={styles.tabs}>
                {tabs.map((tab) => (
                  <span key={tab.key}>
                    {tab.label}
                    {tab.count === null ? null : <strong>{tab.count}</strong>}
                  </span>
                ))}
              </div>
              <div className={styles.activitySections}>
                <ActivitySection title="Post saya" empty="Belum ada postingan yang dibuat." items={activity.posts} />
                <ActivitySection title="Disimpan" empty="Belum ada postingan yang disimpan." items={activity.saved} />
                <ActivitySection title="Repost saya" empty="Belum ada repost yang aktif." items={activity.reposts} />
                <ActivitySection title="Komentar saya" empty="Belum ada komentar yang tercatat." items={activity.comments} />
              </div>
              <div className={styles.sessionActions}>
                <Link href="/hertz/profile">Credit/history</Link>
                <Link href="/hertz/profile">Setting Telegram/session</Link>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </HertzAppShell>
  );
}
