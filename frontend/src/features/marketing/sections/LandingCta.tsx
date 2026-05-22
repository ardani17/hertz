import Link from 'next/link';
import styles from '../HorizonLanding.module.css';

export function LandingCta() {
  return (
    <section className={styles.ctaSection} aria-label="Mulai pakai Horizon">
      <div className={styles.ctaGlow} aria-hidden="true" />
      <div className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>Siap trading dengan konteks yang lebih jelas?</h2>
        <p className={styles.ctaDescription}>
          Ribuan trader forex memakai Horizon untuk data market, jurnal trade, dan komunitas HERTZ — gratis
          selamanya, tanpa biaya tersembunyi.
        </p>
        <div className={styles.ctaActions}>
          <Link className={styles.primary} href="/hertz">
            Gabung Gratis
          </Link>
          <Link className={styles.secondary} href="/tools">
            Lihat Semua Tools
          </Link>
        </div>
        <p className={styles.securityReassurance}>
          Data Anda tetap privat. Tidak perlu koneksi broker. Kami tidak pernah meminta kredensial akun trading.
        </p>
      </div>
    </section>
  );
}
