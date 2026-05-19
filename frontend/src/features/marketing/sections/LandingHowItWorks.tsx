import styles from '../HorizonLanding.module.css';

export function LandingHowItWorks() {
  return (
    <section className={styles.howItWorks} aria-label="How it works">
      <div className={styles.howItWorksContent}>
        <p className={styles.eyebrow}>Simple as 1-2-3</p>
        <h2>From zero to trading smarter in 3 steps</h2>
        <div className={styles.howItWorksGrid}>
          <div className={styles.howCard}>
            <span className={styles.howCardNumber}>1</span>
            <strong className={styles.howCardTitle}>Sign Up Free</strong>
            <p className={styles.howCardDesc}>
              Create your account in 30 seconds. No credit card, no broker integration needed.
            </p>
          </div>
          <div className={styles.howCard}>
            <span className={styles.howCardNumber}>2</span>
            <strong className={styles.howCardTitle}>Explore Market Data</strong>
            <p className={styles.howCardDesc}>
              Live forex pairs, daily outlook, and analysis tools — everything updates in real-time.
            </p>
          </div>
          <div className={styles.howCard}>
            <span className={styles.howCardNumber}>3</span>
            <strong className={styles.howCardTitle}>Join the Community</strong>
            <p className={styles.howCardDesc}>
              Share setups, journal trades, and learn from active traders on HERTZ.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
