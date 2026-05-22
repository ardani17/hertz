import type { Metadata } from 'next';
import Link from 'next/link';
import { query, queryOne } from '@shared/db';
import type { CreditTransaction, MemberSessionUser } from '@shared/types';
import { buildProfileActivityTabs, HertzProfileService, type HertzProfileActivity } from '@shared/services/hertzProfileService';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { HertzAvatar } from '@/components/feed/HertzAvatar';
import { HertzTelegramLogin } from '@/components/feed/HertzTelegramLogin';
import { getCurrentMember } from '@/lib/memberAuth';
import type { ProfileActivityTab } from '@/lib/hertzProfileActivity';
import { ProfileActivityTabs } from './ProfileActivityTabs';
import { ProfileSessionActions } from './ProfileSessionActions';
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

function formatCredit(value: number | null) {
  if (value === null) return '0';
  return new Intl.NumberFormat('id-ID').format(value);
}

function memberBadge(user: MemberSessionUser) {
  if (user.badge === 'admin') return 'Admin';
  return 'Verified Member';
}

function ProfileStats({ activity }: { activity: HertzProfileActivity }) {
  const items = [
    { label: 'Postingan', value: activity.posts.length },
    { label: 'Disimpan', value: activity.saved.length },
    { label: 'Repost', value: activity.reposts.length },
    { label: 'Komentar', value: activity.comments.length },
  ];

  return (
    <dl className={styles.stats}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function HertzProfilePage() {
  const currentUser = await getCurrentMember();
  const credit = await getCreditSummary(currentUser?.id ?? null);
  const activity = await getActivity(currentUser?.id ?? null);
  const tabs = activity ? (buildProfileActivityTabs(activity) as ProfileActivityTab[]) : [];

  return (
    <HertzAppShell
      active="profile"
      title="Profil"
      description="Ringkasan akun, credit, dan aktivitas HERTZ kamu."
      currentUser={currentUser}
      hideRightRail
    >
      {!currentUser ? (
        <section className={styles.guestPanel}>
          <span className={styles.badge}>Mode baca</span>
          <h2>Login Telegram untuk membuka profil</h2>
          <p>Setelah login, status member, credit, dan aktivitas akan tampil di sini.</p>
          <HertzTelegramLogin />
        </section>
      ) : (
        <div className={styles.profile}>
          <section className={styles.hero}>
            <HertzAvatar
              className={styles.heroAvatar}
              src={currentUser.avatarUrl}
              name={currentUser.displayName}
              username={currentUser.username}
            />
            <div className={styles.heroMain}>
              <span className={styles.badge}>{memberBadge(currentUser)}</span>
              <h2>{currentUser.displayName}</h2>
              <p className={styles.handle}>
                {currentUser.username ? `@${currentUser.username}` : 'Member HERTZ'}
              </p>
              {currentUser.username ? (
                <p className={styles.publicLinkRow}>
                  <Link href={`/@${currentUser.username}`} className={styles.publicLink}>
                    Lihat profil publik
                  </Link>
                </p>
              ) : null}
              {activity ? <ProfileStats activity={activity} /> : null}
              <ProfileSessionActions />
            </div>
          </section>

          <div className={styles.grid}>
            <section className={`${styles.panel} ${styles.creditPanel}`}>
              <p className={styles.panelLabel}>Saldo credit</p>
              <p className={styles.creditValue}>{formatCredit(credit.balance)}</p>
              <p className={styles.panelHint}>Credit dipakai untuk fitur premium di Horizon.</p>
              <div className={styles.quickLinks}>
                <Link href="/tools">Buka tools</Link>
                <Link href="/hertz">Ke feed</Link>
              </div>
            </section>

            <section className={styles.panel}>
              <p className={styles.panelLabel}>Informasi akun</p>
              <dl className={styles.metaList}>
                <div>
                  <dt>Role</dt>
                  <dd>{currentUser.role}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    {currentUser.verifiedMemberAt
                      ? `Verified · ${formatDate(currentUser.verifiedMemberAt)}`
                      : 'Verified member'}
                  </dd>
                </div>
                <div>
                  <dt>Telegram</dt>
                  <dd className={styles.mono}>{currentUser.telegramId ?? '—'}</dd>
                </div>
              </dl>
            </section>

            <section className={`${styles.panel} ${styles.historyPanel}`}>
              <p className={styles.panelLabel}>Riwayat credit</p>
              {credit.transactions.length > 0 ? (
                <ul className={styles.historyList}>
                  {credit.transactions.map((item) => (
                    <li key={item.id}>
                      <strong className={item.amount >= 0 ? styles.creditPlus : styles.creditMinus}>
                        {item.amount > 0 ? `+${formatCredit(item.amount)}` : formatCredit(item.amount)}
                      </strong>
                      <span>{item.description ?? item.source_type}</span>
                      <em>{formatDate(item.created_at)}</em>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyCopy}>Belum ada transaksi credit.</p>
              )}
            </section>

            {activity ? (
              <section className={`${styles.panel} ${styles.activityPanel}`}>
                <p className={styles.panelLabel}>Aktivitas</p>
                <ProfileActivityTabs activity={activity} tabs={tabs} />
              </section>
            ) : null}
          </div>
        </div>
      )}
    </HertzAppShell>
  );
}
