import Link from 'next/link';
import styles from '../HorizonLanding.module.css';

export function LandingCta() {
  return (
    <section className={styles.ctaSection} aria-label="Get started">
      <div className={styles.ctaGlow} aria-hidden="true" />
      <div className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>Ready to Trade with More Clarity?</h2>
        <p className={styles.ctaDescription}>
          Join thousands of forex traders who use Horizon to stay informed, journal their trades, and make
          better decisions. Free forever — no hidden costs.
        </p>
        <div className={styles.ctaActions}>
          <Link className={styles.primary} href="/hertz">
            Get Started Free
          </Link>
          <Link className={styles.secondary} href="/tools">
            See What&apos;s Included
          </Link>
        </div>
        <p className={styles.securityReassurance}>
          Your data stays private. No broker integration required. We never ask for trading account
          credentials.
        </p>
      </div>
    </section>
  );
}
