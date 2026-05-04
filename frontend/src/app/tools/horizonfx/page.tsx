import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../tools.module.css';

export const metadata: Metadata = {
  title: 'HorizonFX V2 Tools',
  description:
    'Ringkasan fungsi folder horizonfx-v2-main sebagai suite market tools.',
  alternates: {
    canonical: '/tools/horizonfx',
  },
};

const featureGroups = [
  {
    title: 'Market Data',
    summary:
      'Economic Calendar, Order Book, dan Exchange Liquidity sudah dipindahkan menjadi halaman aktif di Horizon dengan API proxy ringan.',
    tags: ['Active: Economic Calendar', 'Active: Order Book', 'Active: Exchange Liquidity'],
  },
  {
    title: 'Trading Calculators',
    summary:
      'Pivot Point, Profitability Monte Carlo, dan Elliott Wave sudah dipindahkan sebagai komponen Horizon-native tanpa dependency app lama.',
    tags: ['Active: Pivot Point', 'Active: Profitability', 'Active: Elliott Wave'],
  },
  {
    title: 'Belum Dipindahkan Mentah',
    summary:
      'Chart ECharts, export XLSX, dan dashboard kompleks tidak dipindah mentah karena dependency besar. Versi ringkasnya dibuat fungsional dulu.',
    tags: ['ECharts replaced', 'XLSX skipped', 'Tailwind skipped'],
  },
  {
    title: 'Admin And Analytics',
    summary:
      'Ghost-admin, user management, announcement, page tracking, MongoDB, Redis, dan NextAuth masih berupa referensi karena overlap dengan admin Horizon saat ini.',
    tags: ['Reference only', 'MongoDB', 'NextAuth'],
  },
] as const;

export default function HorizonFxToolPage() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>HorizonFX V2</p>
          <h1>Peta fitur dari aplikasi tools HorizonFX lama.</h1>
          <p className={styles.lede}>
            Folder <code>docs/tools/horizonfx-v2-main</code> adalah source
            Next.js app terpisah. Fungsinya bukan satu tool tunggal, tetapi
            kumpulan fitur market data, kalkulator trading, news, admin, dan
            analytics. Halaman ini menjelaskan apa saja yang bisa dimigrasikan
            ke web Horizon utama.
          </p>
        </div>
      </section>

      <section className={styles.grid} aria-label="Fitur HorizonFX V2">
        {featureGroups.map((group) => (
          <article key={group.title} className={styles.toolCard}>
            <span className={styles.toolLabel}>Module</span>
            <h2>{group.title}</h2>
            <p>{group.summary}</p>
            <ul>
              {group.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Route aktif</p>
        <div className={styles.grid}>
          {[
            ['/tools/pivot-point', 'Pivot Point'],
            ['/tools/profitability', 'Profitability'],
            ['/tools/elliott-wave', 'Elliott Wave'],
            ['/tools/economic-calendar', 'Economic Calendar'],
            ['/tools/order-book', 'Order Book'],
            ['/tools/exchange-liquidity', 'Exchange Liquidity'],
          ].map(([href, label]) => (
            <Link key={href} className={styles.auditLink} href={href}>
              {label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
