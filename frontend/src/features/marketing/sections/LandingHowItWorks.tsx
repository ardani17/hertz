import styles from '../HorizonLanding.module.css';

export function LandingHowItWorks() {
  return (
    <section className={styles.howItWorks} aria-label="Cara kerja Horizon">
      <div className={styles.howItWorksContent}>
        <p className={styles.eyebrow}>Tiga langkah</p>
        <h2>Dari nol ke trading lebih terarah dalam 3 langkah</h2>
        <div className={styles.howItWorksGrid}>
          <div className={styles.howCard}>
            <span className={styles.howCardNumber}>1</span>
            <strong className={styles.howCardTitle}>Daftar Gratis</strong>
            <p className={styles.howCardDesc}>
              Buat akun kurang dari 30 detik lewat Telegram. Tanpa kartu kredit dan tanpa koneksi broker.
            </p>
          </div>
          <div className={styles.howCard}>
            <span className={styles.howCardNumber}>2</span>
            <strong className={styles.howCardTitle}>Cek Data Market</strong>
            <p className={styles.howCardDesc}>
              Pair forex live, Outlook harian, dan tools riset — diperbarui untuk sesi trading Anda.
            </p>
          </div>
          <div className={styles.howCard}>
            <span className={styles.howCardNumber}>3</span>
            <strong className={styles.howCardTitle}>Gabung Komunitas</strong>
            <p className={styles.howCardDesc}>
              Bagikan setup, catat jurnal, dan belajar dari trader aktif di HERTZ.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
