import type { Metadata } from 'next';
import Link from 'next/link';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Gallery sementara tidak aktif',
  description: 'Gallery Horizon belum dibuka untuk publik.',
  alternates: {
    canonical: '/gallery',
  },
};

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell
      active="gallery"
      title="Gallery sementara tidak aktif"
      description="Fitur media komunitas sedang ditahan sampai kurasi siap dibuka."
      currentUser={currentUser}
      hideRightRail
    >
      <section className={styles.inactivePanel} aria-label="Gallery tidak aktif">
        <span className={styles.badge}>Tidak aktif</span>
        <h2>Gallery sementara tidak aktif</h2>
        <p>
          Fitur Gallery belum dibuka untuk publik. Konten akan tersedia setelah
          kurasi media selesai.
        </p>
        <Link href="/hertz" className={styles.cta}>
          Kembali ke HERTZ
        </Link>
      </section>
    </HertzAppShell>
  );
}
