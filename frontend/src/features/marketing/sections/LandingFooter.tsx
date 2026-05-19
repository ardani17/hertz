import Image from 'next/image';
import Link from 'next/link';
import styles from '../HorizonLanding.module.css';

export function LandingFooter() {
  return (
    <>
      <nav className={styles.mobileDock} aria-label="Horizon mobile navigation">
        <Link href="/hertz">HERTZ</Link>
        <Link href="/outlook">Outlook</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/tools">Tools</Link>
        <Link className={styles.mobileDockLogin} href="/hertz">
          Sign In
        </Link>
      </nav>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Image src="/images/logo/Logo-Horizon-Atom-Online-White_8.png" alt="" width={22} height={22} />
            <strong>HORIZON</strong>
            <span>Market Intelligence</span>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/hertz">HERTZ</Link>
            <Link href="/outlook">Outlook</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/tools">Tools</Link>
          </div>
        </div>
        <div className={styles.footerMid}>
          <p className={styles.footerAbout}>
            Horizon is a free forex market intelligence platform built for traders who want better tools and a
            stronger community.
          </p>
          <a
            className={styles.footerTelegram}
            href="https://t.me/horizon_forex"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join our Telegram Community →
          </a>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomLeft}>
            <span className={styles.footerCopy}>© {new Date().getFullYear()} Horizon. All rights reserved.</span>
            <span className={styles.footerBuilt}>Built with care for the forex community</span>
          </div>
          <div className={styles.footerLegal}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
